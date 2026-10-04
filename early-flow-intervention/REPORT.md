# Early / Late Robot-Flow Intervention

Status: INTERIM — NOT A FINAL CONCLUSION (4/1890 primary conditions tracked).

같은 배경 변화가 만든 로봇 flow를 초기 또는 후기에 BG0 방향으로 교정해 최종 궤적이 복원되는지 검사했다. 같은 현재 latent에서 BGb와 BG0 flow를 계산하고 로봇 영역만 교체했다. 초기 물리 상태·action·noise·모델·스케줄은 동일하다.

**현재 답:** 전체 표본 수집 중이다. Pilot의 관측으로 일반 결론을 내리지 않는다.

| 질문 | 답 | 직접 근거 |
|---|---|---|
| Q1. Early correction reduces BG drift | INCONCLUSIVE | mean 0.0033, 95% CI [undefined, undefined], n=1 |
| Q2. Early is better than late | INCONCLUSIVE | mean 0.0585, 95% CI [undefined, undefined], n=1 |
| Q3. Full is stronger than stage-specific correction | INCONCLUSIVE | Full−Early mean -0.0402, 95% CI [undefined, undefined], n=1; Full−Late mean 0.0184, 95% CI [undefined, undefined], n=1 |
| Q4. Spatial specificity to the robot region | INCONCLUSIVE | Early robot − early far-background recovery: mean undefined, 95% CI [undefined, undefined], n=0; region sizes and intervention magnitudes differ. |
| Q5. Larger early drift predicts greater benefit | INCONCLUSIVE | Task-demeaned Spearman mean undefined, 95% CI [undefined, undefined], n=1; association is not mediation. |
| Q6. Early correction reduces MuJoCo GT error | INCONCLUSIVE | BGb ADE minus early ADE (positive=improvement, px): mean 0.0791, 95% CI [undefined, undefined], n=1 |
| Q7. Subsequent robot latent stays closer to BG0 | INCONCLUSIVE | Post-early positions12–35 mean normalized-z distance reduction: mean 0.0094, 95% CI [undefined, undefined], n=1 |
| Q8. Background switching supports early influence | INCONCLUSIVE | Secondary switch results are reported separately; do not substitute them for robot-only intervention. |
| Q9. Evidence for a causal contribution of early robot flow | INCONCLUSIVE | Assess direct paired interventions, spatial controls, latent persistence and tracking quality jointly. BG0 is not physical truth; soft geometric masks cannot isolate all robot information. |

## 결과 해석

Early recovery: mean 0.0033, 95% CI [undefined, undefined], n=1. Late recovery: mean -0.0553, 95% CI [undefined, undefined], n=1. Recovery는 BG0 모델 궤적에 가까워진 비율이며, 양수가 이득이다. MuJoCo ADE 개선은 별도로 보고한다.

관측된 교정 효과는 지정한 soft robot mask 및 stage 범위에 대한 개입 효과이다. 작은 효과가 로봇 flow의 모든 인과 영향이 없음을 뜻하지 않는다. 배경/물체/다른 view의 표현, mask 밖으로 이동한 생성 로봇, tokenizer 공간·시간 혼합을 통해 영향이 남을 수 있다. Full 교정도 전체 모델 상태를 BG0로 바꾸지는 않는다. Early를 motion planning이라고 부르지 않는다.

## 고정 설정 및 품질 관리

- EX2 settled_v2: 6 tasks, BG0–BG15, seeds0–2. First20 actions; two model views; robot intervention only agentview future latent1–5.
- Actual flow evals0–35. Early0–11 / middle12–23 / late24–35. Step35 is final denoise for decoder. AB2 history continues without reset.
- Existing temporal RGB segmentation coverage is the soft intervention mask. Coverage≥0.5 is the unchanged metric mask. Soft boundaries are partial correction even at α=1.
- BG0/BGb baseline decoded pixels must match cached EX2 videos exactly. BG0 identity must preserve latent path exactly. On every paired forward, current tensor and RNG must remain identical.
- EX2 MuJoCo full GT arrays are exactly equal across16 backgrounds (96 checks). Same camera and projection oracle; no physics rerun required.
- Existing CoTracker3 / fixed hand-surface queries. Uniform21-frame input for all conditions; do not mix prior41-frame offline tracker outputs. All points visible on≥95% futureframes; no failure interpolation. Uncalibrated confidence is exported and does not prove correctness.
- Primary unit task/seed/background. Task bootstrap1000, six task clusters. Per-task results and paired contrasts saved; frames are not independent samples.
- Near-zero baseline drift≤1e-4px yields undefined Recovery. D_BG and D_int always accompany it. Far-background mask excludes two output-grid cells around any robot coverage; mask sizes differ.

[Protocol](configs/protocol.json) · [Trajectory CSV](results/trajectory_metrics.csv) · [Paired CSV](results/paired_early_late.csv) · [Correlations](results/mechanism_correlations.csv) · [Previous site](https://hyesoo0411.github.io/world-model/visualization/)
