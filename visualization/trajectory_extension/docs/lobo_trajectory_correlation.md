# Trajectory drift ↔ LOBO Action R²

같은 task·background에서 최종 생성 궤적의 BG0 대비 변화와 LOBO action 회귀 성능이 연관되는지 확인했다. 기존 결과만 사용했다.

궤적 drift는 유효한 canonical rollout seed 0·1·2를 평균했다. LOBO R²는 seed 0의 별도 held-out action 16개로 평가한 값이다. 따라서 점 하나는 task·background 그룹이며, 동일 action의 개별 예측을 연결한 분석은 아니다. BG0는 제외했다.

| Probe | Step | Group | Spearman ρ | 95% CI | Pearson r | n |
|---|---:|---|---:|---|---:|---:|
| linear | 0 | pooled | -0.026 | [-0.466, 0.338] | 0.076 | 90 |
| linear | 0 | task_demeaned | -0.407 | [-0.577, -0.207] | -0.289 | 90 |
| linear | 35 | pooled | 0.118 | [-0.322, 0.503] | 0.209 | 90 |
| linear | 35 | task_demeaned | -0.275 | [-0.401, -0.157] | -0.119 | 90 |
| mlp | 0 | pooled | 0.216 | [-0.444, 0.621] | 0.269 | 90 |
| mlp | 0 | task_demeaned | -0.322 | [-0.600, -0.097] | -0.154 | 90 |
| mlp | 35 | pooled | 0.293 | [-0.241, 0.667] | 0.308 | 90 |
| mlp | 35 | task_demeaned | -0.137 | [-0.219, -0.106] | -0.060 | 90 |

Task-centered는 시점별 두 변수에서 각각 task 평균을 뺀 값이다. CI는 6 task를 cluster로 1000회 재표집했다. 각 denoising 시점에서 궤적 값은 같은 최종 rollout 값이며, LOBO R²만 해당 시점의 flow로 측정된다. Frame·seed·denoising 시점을 독립 표본으로 합치지 않았다.

음의 상관은 궤적 변화가 큰 배경에서 LOBO 성능이 낮은 경향을 뜻한다. 이는 그룹 수준의 연관이며, action 정보 손실이나 궤적 변화의 원인을 증명하지 않는다. Task 구성과 서로 다른 action cohort가 대안 설명으로 남는다.

Tracker QC로 제외한 rollout: 0.
