# Full-spatial cumulative intervention

Purpose: keep BGb base observation fixed, replace the complete raw flow with the BG0 counterfactual at the same current intervention latent, and measure final trajectory recovery.

The validated EX10 model loader, condition builder, `Runner.predict`, simulator masks and CoTracker pipeline are reused. Previous results are read-only; their source hashes are in `previous_result_manifest.json`. No observation-switch runner is called.

`Runner.hook` previously blended raw DiT output through a soft robot mask. The EX12 override returns the entire counterfactual tensor directly, so active `v_used == v0` is bitwise exact. Inactive steps leave raw BGb flow untouched. Both branches use the same actual sampler latent, sigma, action and deterministic RNG state; condition tensor fingerprints are checked.

Official `MultiviewVideo2WorldActionConditionedStatePredPipeline.denoise` converts raw `net_output_B_C_T_H_W` to x0 using its own scaling and reimposes `condition.gt_frames` on conditioning-frame positions. The main branch's condition remains BGb, including this clamp. The counterfactual branch's x0 is discarded. The original `RectifiedFlowAB2Scheduler.step(clean,step,sample,previous)` alone changes the sampler state. No BG0 latent is inserted.

For this reason All-steps is an upper-bound/sanity condition under the fixed BGb condition constraint, not a guarantee of exact decoded BG0 pixels. We measure future latent equality/distance and the final trajectory; remaining differences can also reflect the unchanged conditioning-frame/decode path.

Temporal windows are fixed: E0–11, E+M0–23, M+L12–35, All-steps0–35. E+M and M+L each include24 flow evaluations, but not identical sigma spans/integrated update magnitudes. Step35 is a final clean evaluation for decoding, not an additional AB2 update. Thus matched evaluation count does not establish equal intervention dose.

Per-step diagnostics use full [1,16,12,32,32], the existing robot metric mask (coverage>=0.5 in agentview future slots1–5), and its complement. The complement includes other views and conditioning frames, not exclusively physical background. Additional future-only non-robot diagnostics exclude conditioning-frame positions. RMS is over selected elements, not zero-padded full tensors.

Existing 21-frame CoTracker input, fixed projected query points, confidence/visibility and >=95% jointly visible future-frame gate are preserved. GT is the same MuJoCo projected query-center trajectory. BG0 is only the model reference.

Source details: `cosmos_predict2/pipelines/video2world_multiview_action_state_pred.py`, class `MultiviewVideo2WorldActionConditionedStatePredPipeline`, method `denoise`, raw DiT output at line566, official flow-to-clean conversion at line574, conditioning-frame clamp at line577. The inherited `Runner.predict` verifies that model evaluations do not mutate the sampler state or CPU/CUDA RNG state. `FullSpatialRunner.hook` is the only replacement of the prior prediction path.

The model's normalized flow time is tau=sigma/(1+sigma); future network time is tau times the official time-scaling factor. Sigma decreases through the actual stored Karras schedule. Progress=step/35 is an evaluation-order label, not linearly spaced tau or equal integration mass.

Conditioning positions C (latent slots0 and6) are clamped by the official clean-estimate path and have no direct clean reconstruction loss. Whole-tensor raw-flow diagnostics include these positions and should not be read as pure future dynamics. The future-only outside-mask diagnostic removes C slots. The full-spatial hook still assigns the complete raw tensor exactly as requested, before the unchanged official clamp.

A deterministic decoder can produce different RGB frames despite identical future clean latents when the conditioning latents differ. `all_steps_decode_residual.csv` records the condition-slot latent distance and every decoded frame's RGB difference to BG0 to expose this residual path separately from flow intervention success.
