# Robot-flow drift와 LOBO Action R²

동일한 16 held-out action에서 얻은 평균 normalized robot-flow drift와 LOBO Action R²의 관계를 확인했다. 기존 캐시만 사용했고 추론·probe 학습을 다시 실행하지 않았다.

| Probe | 시점 | 그룹 | Spearman ρ | 95% CI | Pearson r | n |
|---|---:|---|---:|---|---:|---:|
| linear | 0 | pooled | 0.119 | [-0.409, 0.290] | 0.128 | 90 |
| linear | 0 | task_demeaned | -0.650 | [-0.785, -0.510] | -0.607 | 90 |
| linear | 35 | pooled | 0.170 | [-0.487, 0.534] | 0.219 | 90 |
| linear | 35 | task_demeaned | -0.568 | [-0.706, -0.451] | -0.606 | 90 |
| mlp | 0 | pooled | 0.215 | [-0.378, 0.302] | 0.267 | 90 |
| mlp | 0 | task_demeaned | -0.577 | [-0.883, -0.246] | -0.469 | 90 |
| mlp | 35 | pooled | 0.151 | [-0.559, 0.599] | 0.109 | 90 |
| mlp | 35 | task_demeaned | -0.538 | [-0.645, -0.343] | -0.608 | 90 |

X는 각 action과 동일 action의 BG0 flow를 비교한 뒤 16개 action의 normalized drift를 평균한 값이다. Y는 같은 held-out cohort에서 평가한 LOBO macro R²이다. BG0는 제외하고, task·시점별 평균을 두 변수에서 각각 빼는 task-demeaned 상관을 pooled 및 task별 결과와 함께 보고한다.

음의 상관은 큰 flow drift와 낮은 LOBO 성능의 연관을 뜻한다. R²는 분류 accuracy가 아니다. 배경마다 제외되는 학습 배경도 달라지므로 이 상관을 flow drift가 성능 하락을 일으킨다는 인과 증거로 해석하지 않는다. 6 task cluster에 대한 bootstrap이며 개별 action/frame을 독립 표본으로 늘리지 않았다.
