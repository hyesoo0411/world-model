# A2World flow interface

주 표현은 **DiT의 직접 출력 `net_output_B_C_T_H_W`**다. `DenoisePrediction.x0`와 `.eps`는 주 표현이 아니다.

Source root: `[EX1]_reverse_causal/vendor/A2World/world_model`.
Git commit: `077e10ad6cee07342b5e779f11fea78247584834`.
Checkpoint: `Fleurrr/A2World-World-Model/a2world-libero.pt`, revision `411846321a75f1b64af2ab79af3db939c85d6a72`, SHA256 `0d462d248cf0718ca9d360b5860b4b1090b80ba638ee6463133788324b08cbe2`.
Cache: `HF_CACHE/hub/models--Fleurrr--A2World-World-Model/snapshots/411846321a75f1b64af2ab79af3db939c85d6a72/a2world-libero.pt`.
Tokenizer: `nvidia/Cosmos-Predict2-2B-Video2World`, revision `f50c09f5d8ab133a90cac3f4886a6471e9ba3f18`, `tokenizer/tokenizer.pth`, HF 기본 캐시.

| Interface | 실제 source / method / variables |
|---|---|
| Pipeline | `cosmos_predict2/pipelines/video2world_multiview_action_state_pred.py`, `MultiviewVideo2WorldActionConditionedStatePredPipeline.denoise` (line 495) |
| DiT | `cosmos_predict2/models/video2world_multiview_action_state_pred_dit.py`, `ActionConditionedMultiViewStatePredDiT.forward` (line 1074) |
| Network input | `net_state_in_B_C_T_H_W`, `timesteps_B_T`; condition slots replaced with clean observation latents |
| Direct output | `net_output_B_C_T_H_W = self.dit(...)`, converted to float32 after forward |
| Shape | `[B,C,V*T,H,W] = [1,16,12,32,32]` for 2 views, 21 frames/view, 256×256 pixels |
| Temporal layout | 6 latent positions per view: one conditioning position + five future positions. Views concatenated along temporal dimension |
| Spatial layout | Tokenizer factor 8: 256→32. DiT spatial patching 2×2: internal 16×16 tokens; output is unpatched 32×32 flow grid |
| Scaling | `cosmos_predict2/module/denoiser_scaling.py`, `RectifiedFlowScaling.__call__`: `t=sigma/(sigma+1)`, `c_in=c_skip=1-t`, `c_out=-t`, `c_noise=t*t_scaling_factor` |
| Clean diagnostic | official `x0_pred = c_skip*xt + c_out*net_output`, then conditioning positions replaced with GT |
| Schedule | `cosmos_predict2/schedulers/rectified_flow_scheduler.py`, `RectifiedFlowAB2Scheduler.set_timesteps/step`; Karras sigma 200→0.01, order 7, 35 steps plus final prediction |

Sampler state `xt = x0 + sigma*epsilon` is not the normalized rectified-flow input. The network sees `z_t = xt/(1+sigma) = (1-t)*x0 + t*epsilon` on future slots. Therefore the raw network target is `epsilon-x0 = dz_t/dt`. We save both sampler `xt` and normalized future `z_t`; compare identical tensors across backgrounds. High noise means large sigma/t. Denoising progress is step index/35, not t itself.

## Actual loss: weighted equivalent, not assumed uniform flow MSE

`cosmos_predict2/models/video2world_multiview_action_state_pred_model.py:293`, `Predict2Video2WorldActionConditionedMultiviewStatePredModel`, inherits `Predict2Video2WorldModel.compute_loss_with_epsilon_and_sigma` in `models/video2world_model.py:463`.
It forms `xt_B_C_T_H_W=x0+sigma*epsilon`, calls `self.pipe.denoise`, computes `(x0-model_pred.x0)**2`, and multiplies by inherited `get_per_sigma_loss_weights` at line 452: `(sigma**2+sigma_data**2)/(sigma*sigma_data)**2`.

With required `sigma_data=1`, future-slot loss is algebraically
`[(sigma²+1)/(1+sigma)²] * ||net_output-(epsilon-x0)||²`.
This is positive noise-weighted flow matching, **not exactly uniform flow MSE**. `RectifiedFlowScaling.sigma_loss_weights` offers uniform-flow weighting but is not called by this inherited training loss. Conditioning slots have zero clean-estimate loss by explicit replacement. Loss reduction/scaling may multiply this further.

## Mask alignment and its limits

`tokenizers/tokenizer.py:966`, `TokenizerInterface`, reports spatial factor 8, temporal factor 4, 16 channels; frame count `1+(N-1)//4`. `VAE_.encode` processes first frame separately, then `[1:5]`, `[5:9]`, etc., with causal feature caches. RGB undergoes the same upright orientation and INTER_AREA resize; no crop in the supplied-tensor path. Temporal coverage uses the actual first-frame/4-frame grouping; spatial coverage is area occupancy on the verified output grid. Thresholds 0.25/0.5/0.75 are applied after coverage averaging; conditioning slots are excluded.

Coverage is a geometric attribution, **not an exact inverse of the nonlinear tokenizer**. Causal convolutions and spatial attention mix information beyond a cell. One internal-token dilation corresponds to two output-grid cells. Save ownership coverage, optional dilation, and RGB/grid overlays; do not claim perfect robot-only latent separation.
