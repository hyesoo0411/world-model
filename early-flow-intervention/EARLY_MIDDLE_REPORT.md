# Early + Middle robot-flow 추가 개입

Early 교정을 Middle까지 유지하면 최종 생성 궤적이 BG0 쪽으로 더 회복되는지 검사했다.

추가 조건: step0–23에서 α=1 soft robot-flow 교정, step24–35에서는 원래 BGb flow를 사용했다. Task·배경·seed·action·noise·mask·scheduler·21-frame tracker는 동일하다. 기존 조건은 재사용했다.

**Early 단독보다 회복되는가: INCONCLUSIVE.** Paired 회복률 차이는 7.90%p, task-bootstrap 95% CI [-4.04, 19.51]%p이다(n=269).

| 비교 | Paired n | 평균 회복률 차이 %p | 95% CI %p |
|---|---:|---:|---|
| Early+Middle vs early | 269 | 7.90 | [-4.04, 19.51] |
| Early+Middle vs middle | 270 | 2.18 | [-1.02, 4.77] |
| Early+Middle vs late | 270 | 12.77 | [-0.81, 25.46] |
| Early+Middle vs full | 270 | 6.89 | [2.62, 10.91] |

| 조건 | n | D_BG px | D_int px | 평균 회복률 % | GT ADE px |
|---|---:|---:|---:|---:|---:|
| early | 269 | 1.3747 | 1.2983 | 5.11 | 2.1384 |
| middle | 270 | 1.4635 | 1.2865 | 10.79 | 2.1605 |
| early_middle | 270 | 1.4635 | 1.1915 | 12.97 | 2.0718 |
| late | 270 | 1.4635 | 1.4627 | 0.20 | 2.2998 |
| full | 270 | 1.4635 | 1.2015 | 6.08 | 2.0817 |

GT ADE improvement relative to BGb baseline: 0.221460px; 95% CI [0.034073, 0.552388]. Positive means closer to MuJoCo GT; distinct from recovery toward BG0.

Interpretation: This followup tests the benefit of continuing correction through Middle. Early and Early+Middle share the exact path through latent position12; Full and Early+Middle share the exact path through position24. The Full contrast tests adding Late correction after the same Early+Middle history. Longer duration and larger integrated intervention are not matched to Early/Middle alone. Do not infer equal-dose stage importance or additive causal contributions. BG0 is a model reference, not physical GT. First20 future-frame 2D hand trajectories, fixed GT soft mask, appearance-sensitive tracker, and six task clusters limit generalization.

Tracker QC exclusions: 0. No interpolation. See early_middle_metrics.csv for D_BG, D_int, Recovery, ADE/FDE and QC; paired CSV uses a common frame intersection for each contrast.

## 작은 baseline drift에 대한 보조 확인

전체 유효 표본의 primary 결과를 유지한다. 1px/5px cutoff는 추적 정확도 기준이 아니다.

| 최소 D_BG px | n | task 수 | Δ Recovery | 95% CI |
|---:|---:|---:|---:|---|
| 0 | 269 | 6 | 0.07898993862072533 | [-0.040442072245904494, 0.19507440453667504] |
| 1 | 47 | 4 | 0.1888818459911489 | [0.12213501507493021, 0.4220775901670697] |
| 5 | 19 | 1 | 0.12255447198545931 | [None, None] |

<!-- FOLLOWUP INTERPRETATION -->
## 결과 해석

관측: Early+Middle 평균 회복률은 12.97%이며, Early 대비 paired 차이는 7.90%p이다. 같은 frame에서 측정한 BG0까지의 절대 거리 감소는 평균 0.1936px [95% CI 0.0398, 0.4101]이다.

Task별로 Early 대비 회복률이 증가한 것은 4개, 감소한 것은 2개였다. Middle까지 교정을 유지하는 효과가 일부 task에 있다는 관측과 부합한다. 그러나 주 지표인 paired 회복률 차이의 CI가 0을 포함하므로, task 전반의 추가 회복을 확정하지 않는다. 회복률은 표본별 baseline 거리로 나눠 평균하므로 절대 거리와 다른 결론을 낼 수 있다.

Full 대비 회복률 차이는 양수지만, 절대 거리 차이는 0.0100px [95% CI -0.0007, 0.0212]이다. Late 교정이 크게 또는 일관되게 해롭다고 일반화하지 않는다.

| Task | Early+Middle 회복 % | Early 대비 paired Δ %p |
|---|---:|---:|
| Original | 7.08 | 0.76 |
| T01 | -3.21 | -2.69 |
| T02 | 25.08 | 19.09 |
| T03 | 19.54 | 15.61 |
| T04 | -13.15 | -13.74 |
| T05 | 42.48 | 28.22 |

개입 구간이 Early 단독의 두 배이므로 동일 개입량에서 Middle의 중요도가 더 크다는 검정은 아니다. 첫20 future frame의 2D 손 궤적, 고정 GT mask, 추적의 외형 민감도, 6개 task만 분석했다는 한계가 있다.

[자원 사용 CSV](results/early_middle_resources.csv) · [완료 provenance](docs/early_middle_completion.json)
<!-- FOLLOWUP INTERPRETATION END -->
