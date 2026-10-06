# Stage-wise robot-flow-only intervention: implementation audit

목적: BGb 관측을 고정하고 robot-associated raw flow만 BG0 반사실 방향으로 바꿀 때 최종 궤적이 회복되는지 확인한다. 기존 observation-switch 자료는 분석에서 제외하고 메인 사이트에서 제거한다.

- Observation switching: `scripts/run_intervention.py:Runner.run`의 `switch_*` 분기. 새 검증 실행은 이 메서드를 호출하지 않는다. `strict_flow_validate.py`는 고정 `bgcond`로만 main forward를 수행한다.
- Flow: 동일 파일 `Runner.hook`에서 실제 DiT output을 캡처한다. `Runner.predict`는 공식 `pipe.denoise(...).x0` 경로를 사용하되, hook이 raw flow를 교정한 뒤 공식 clean 변환을 적용한다. x0는 분석 표현이 아닌 scheduler API의 공식 입력이다.
- Update: `pipe.scheduler.step(clean, step, sample, previous)`의 공식 AB2. 이전 예측과 현재 latent를 경계에서 초기화하거나 직접 교체하지 않는다. 35 updates와 마지막 clean 평가를 포함해 36 flow evaluations.
- Same-current-x: 별도 BG0 baseline의 flow를 가져오지 않는다. 현재 sample을 BG0 반사실 평가와 BGb main 평가에 동일하게 전달한다. tensor hash와 RNG 불변을 확인한다.
- Mask: `common10.masks` → EX8 `data/<task>/masks/canonical.npz`. Simulator 시간별 coverage, agentview future slots1–5, 나머지0. Intervention은 기존 soft coverage[0,1], metric은 coverage≥0.5. 경계에서는 부분 교체이므로 correction<100%가 예상된다. Hard-mask 실험으로 표현하지 않는다.
- Cache reuse: 기존 `early/middle/late/full/background_early/background_full`는 관측 전환 분기를 사용하지 않았다. 모든 sample에서 metadata의 condition, 실제 저장 latent hash, raw flow swap 식, mask 밖/비개입 구간 불변을 재검증한다. BG0/BGb baseline, 모든 stage, far controls를 Original/seed0/BG8에서 독립적으로 재실행해 기존 tensors와 decoded pixels의 exact equality를 확인한다.
- No-op: BG8 main/counterfactual 모두 BG8. 6 tasks×3 seeds에서 36단계 double evaluation. latent·decoded pixels가 BG8 baseline과 bitwise 같으면 동일 deterministic CoTracker 결과를 재사용한다. 별도 tracker forward를 한 것으로 주장하지 않는다.
- Trajectory: EX2/EX7 CoTracker3, 동일 hand-surface queries, 모든 조건21프레임 입력. 이전41-frame tracker와 혼합하지 않는다. `tracks.npz`의 confidence/visibility를 보존한다. frame1–20 공통 유효분율≥95%; 실패 보간 없음. ADE/FDE는 pixel 단위.
- Physics: `docs/source_audit.json`의 6 tasks×16 backgrounds GT equality 검증을 유지한다. MuJoCo projected query oracle를 사용하며 BG0를 physical GT로 부르지 않는다.
- Inference set: 6 tasks×3 seeds×15 perturbed backgrounds=270. 기존 1080 robot-stage rollouts +540 far-background controls와288 baseline을 재사용한다. 새 observation-switch inference는 없다.
- Statistics: 동일 sample 및 공통 유효 frame에서 Early/Middle/Late/Full을 비교한다. 1000 task-cluster bootstrap, seed42. Median, mean, per-task 및 Middle−Early/Middle−Late/Early−Late. BG0 recovery와 GT accuracy는 별도로 계산한다. 6 task clusters의 제한을 명시한다.

## Verified official interface

`[EX1]_reverse_causal/vendor/A2World/world_model/cosmos_predict2/pipelines/video2world_multiview_action_state_pred.py`, class `MultiviewVideo2WorldActionConditionedStatePredPipeline`, method `denoise` (line495): `xt_B_C_T_H_W` is the sampler input; `net_output_B_C_T_H_W = self.dit(...)` is intercepted at the raw DiT output. It is converted officially by `x0_pred_B_C_T_H_W = c_skip_B_1_T_1_1 * xt_B_C_T_H_W + c_out_B_1_T_1_1 * net_output_B_C_T_H_W`. The current-frame conditioning overwrite remains BGb in the main branch. The BG0 branch's clean estimate is discarded.

`cosmos_predict2/schedulers/rectified_flow_scheduler.py`, class `RectifiedFlowAB2Scheduler`, method `step(x0_pred, i, sample, x0_prev)` (line75): first update uses `reg_x0_euler_step`; subsequent updates use `res_x0_rk2_step`. Stored `previous` follows the intervention trajectory. Raw model flow shape is `[1,16,12,32,32]`; only robot coverage in agentview future indices1–5 is modified.
