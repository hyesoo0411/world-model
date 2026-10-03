# 전체 flow와 누적 flow 차이

## 확인하려는 것

Robot 영역에서 보인 후반 RMS 감소가 전체 flow에서도 나타나는지, 그리고 순간 차이가 작아져도 앞선 flow 차이의 누적이 남는지 확인했다. 기존과 같은 action·물리 상태·noise·τ의 paired raw flow를 재사용했다. 새 모델 추론은 하지 않았다.

사이트 3번은 순간 flow 차이, 4번은 그 차이의 denoising 진행도별 곡선이다. 새 5번은 누적 진단이다. 기존 probe/ratio/video는 6/7/8번으로 이동했다.

## 영역

| 이름 | 계산 영역 |
|---|---|
| Robot | agentview future L1–L5에서 simulator robot mask가 선택한 위치 × 16채널 |
| All space | 동일한 agentview future L1–L5의 모든 32×32 위치 × 16채널 |
| Full raw tensor | `[1,16,12,32,32]` 전체; 두 카메라와 conditioning 슬롯 포함 |

Robot과 All space는 L 하나를 선택할 수도 있다. Full raw tensor는 항상 12슬롯 전체다. Conditioning 슬롯은 sampler에서 관측으로 고정하므로 이 영역의 raw DiT 출력 차이는 실제 생성 업데이트와 같지 않다. Full raw tensor는 보조 진단이며, 배경 자체가 달라서 전체 flow가 달라지는 것을 실패로 해석하지 않는다.

3번의 unmasked 공간 heatmap은 agentview future 5개를 시점별로 표시한다. Heatmap 셀은 채널 RMS, 표와 곡선은 선택된 모든 원소의 RMS다. Robot mask가 있는 heatmap과 없는 heatmap은 각각 표시된 색상 범례를 확인해야 한다.

## 누적 정의

τ는 실제 A2World flow 시간 `sigma/(1+sigma)`다. 약 0.995에서 0.0099로 내려간다. Raw flow는 normalized latent `z_τ`에 대한 변화 방향이며, sampler의 비정규화 상태 `x_τ`의 단순 업데이트량과 같지 않다.

동일한 공통 BG0 경로에서:

```text
Δv_i = v_background(x_τi, τ_i) − v_BG0(x_τi, τ_i)
D_i = RMS_region(Δv_i)
w_i = τ_(i−1) − τ_i > 0

C_mag(k) = Σ_(i=1..k) w_i × (D_(i−1) + D_i) / 2
C_vec(k) = RMS_region[Σ_(i=1..k) (−w_i) × (Δv_(i−1) + Δv_i) / 2]
```

- **C_mag:** 차이의 크기 누적. 음수가 아닌 RMS를 쌓으므로 감소하지 않는다. 초반 차이가 있으면 후반 순간 RMS가 낮아져도 앞선 값이 남는다. 이는 정의상 성질이며 새 물리적 발견은 아니다.
- **C_vec:** 벡터를 먼저 적분한 뒤 RMS를 계산한다. 반대 방향의 차이는 상쇄된다. 이 값은 감소할 수도 있다.
- 누적 시작점은 0이다. 첫 시점의 RMS 자체는 0일 필요가 없다.
- 두 값은 실제 τ 간격을 반영한다. 단순 RMS 합이나 denoising step index에 대한 합이 아니다. 순간 RMS와 단위·의미가 달라 직접 크기를 동일하게 비교하지 않는다.

## 수치 적분의 범위

저장된 step `[0,4,8,12,16,19,23,27,31,35]`의 10개 예측을 사다리꼴 공식으로 적분했다. 36개 전체 예측 중 저장되지 않은 26개 사이 값은 선형 근사에 해당한다. τ 간격은 균일하지 않다. 더 촘촘한 샘플로 적분값의 수렴 여부를 검증하지 않았다. 측정되지 않은 τ=1 또는 0까지 외삽하지 않았다.

실제 sampler는 `RectifiedFlowAB2Scheduler.step`의 x0 기반 Euler/AB2 업데이트다. 여기서는 그 scheduler를 재실행하거나 최종 상태를 복원하지 않았다. **공통 경로에서 측정한 flow 민감도의 적분**이며, 각 배경의 독립 생성 경로 간 최종 latent 차이나 영상의 로봇 이동량이 아니다. 같은 τ마다 실제 입력 tensor가 동일한 기존 통제를 유지한다.

## 결과 예시와 의미

Original task · seed 0 · BG8 vs BG0:

| 시점 | Robot RMS | All space RMS | Full raw RMS |
|---|---:|---:|---:|
| step 0 | 0.489713 | 0.370922 | 0.401960 |
| step 16 | 0.540271 | 0.375993 | 0.415046 |
| step 35 | 0.095429 | 0.217147 | 0.196561 |

이 예시에서 전체 raw flow도 후반에 감소한다. 따라서 관측된 감소는 robot mask 영역에만 나타나는 현상은 아니다. 하지만 이것만으로 감소의 원인이나 모든 task의 보편적 경향을 확정하지 않는다.

| 최종 누적, step 35 | C_mag | C_vec |
|---|---:|---:|
| Robot L1–L5 | 0.203785 | 0.133706 |
| All space L1–L5 | 0.168919 | 0.118704 |
| Full raw tensor | 0.196926 | 0.149242 |
| Robot L5 | 0.221877 | 0.145920 |

C_vec가 C_mag보다 작다는 것은 벡터 방향·성분을 유지한 적분이 차이 크기만 누적한 값보다 작다는 뜻이다. 방향의 상쇄/비정렬을 반영하지만, 독립 rollout이 서로 수렴했다는 증거는 아니다. 누적 진단도 GT mask 정렬과 tokenizer의 시공간 혼합 한계를 공유한다.

## 출력과 검증

- 전체 순간 측정: [JSON](../results/full_flow_metrics.json), [CSV](../results/full_flow_metrics.csv), 2,880개 row.
- 누적 측정: [JSON](../results/cumulative_flow_metrics.json), [CSV](../results/cumulative_flow_metrics.csv), 13개 영역별 총 37,440개 row.
- 적분 벡터: `results/<task>/seed<seed>/cumulative_flow/BG*_final_integral.npz`; shape `[16,12,32,32]`, 부호 있는 dτ 적분, 원래 mask 및 실제 τ 저장.
- 새 순간 RMS와 기존 RMS의 최대 절대 차이 `1.11e-16`. BG0 차이는 0, 누적 시작은 0, C_mag 단조 증가, 모든 영역에서 `C_vec ≤ C_mag` 확인.
- Figure PNG/PDF: `figures/10_full_flow_*`, `figures/11_cumulative_flow_*`.
- [계산 검증](../results/cumulative_flow_validation.json), [방법 metadata](../results/cumulative_flow_method.json). 재현: `runtime/simvenv/bin/python scripts/full_and_cumulative_flow.py`.
