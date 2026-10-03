# 미래 latent 시점별 robot flow RMS

배경 변화의 영향이 특정 미래 구간에 집중되는지 확인했다. 기존 canonical action의 저장된 raw flow를 L1–L5로 나누어 비교했다. 모델 재추론 없이 같은 noisy tensor·action·τ·물리 상태로 얻은 기존 예측을 사용했다.

20 future RGB frames / temporal compression 4 = 5 future latents다. 각 latent의 flow는 `[16,32,32]`이며 하나의 scalar velocity가 아니다. 카메라별 conditioning 슬롯 1개를 더하면 6개, 두 카메라를 이어 붙인 전체 flow는 `[1,16,12,32,32]`다. 주 분석은 agentview의 future 슬롯 1–5만 사용한다.

| Future latent | RGB mask 정렬 구간 |
|---|---|
| L1 | frames 1–4 |
| L2 | frames 5–8 |
| L3 | frames 9–12 |
| L4 | frames 13–16 |
| L5 | frames 17–20 |

이 구간은 압축 격자에 mask를 맞추는 기준이다. Tokenizer의 receptive field와 모델의 시간축 혼합 때문에 해당 latent가 이 4프레임만 독립적으로 표현한다고 단정할 수 없다. 영상 시간 L과 denoising 시간 τ는 다른 축이다. 미래 GT 영상은 mask 계산에만 사용하고 flow 모델에 입력하지 않는다.

## 계산

각 L의 mask coverage ≥0.5인 공간 위치만 선택한다. `n_L = Σ_hw M[L,h,w]`일 때:

```text
Δv = v_background − v_BG0
D_bg(τ,b,L) = sqrt(Σ_chw M[L,h,w] Δv[c,L,h,w]² / (16 n_L))
D_action(τ,L) = 같은 계산에 v_BG0,A_delta − v_BG0,A 적용
Ratio(τ,b,L) = D_bg(τ,b,L) / D_action(τ,L)
```

시점별 분자·분모를 함께 표시한다. 첫 action step의 x 좌표만 `0.05 × training-demo std`만큼 바꾼 기존 대조군을 사용한다. 분모 ≤10⁻⁶은 undefined다. 이 추가 분석은 canonical action만 대상으로 하며 action bank probe를 다시 학습하지 않는다.

전체 RMS와의 관계는 `D_pooled² = Σ_L n_L D_L² / Σ_L n_L`이다. 시점별 RMS의 산술평균이 아니다. 각 시점 내에서는 선택한 원소 수로 정규화하고, 전체 RMS에서는 토큰이 많은 시점의 비중이 커진다.

## 관측 → 해석 → 한계

6 tasks × 3 seeds × 16 backgrounds × 10 denoising points × 5 future latents = **14,400개** 시점별 결과를 저장했다. 비원본 배경 13,500개 모두에서 robot RMS >10⁻⁶이었다. 같은 task·seed·배경·τ에서 L1–L5의 최대/최소 RMS 비율은 중앙값 **1.93배**, 관측 최대 **7.30배**였다. 이는 독립 표본의 통계적 유의성 검정이 아니라 측정한 조건들의 기술 통계다.

따라서 전체 RMS에 가려진 미래 구간별 크기 차이가 있다. 그러나 항상 먼 미래가 더 민감한 것은 아니다. 아래 값은 task별로 BG1–BG15, seeds 0–2, 10개 τ의 시점별 RMS를 산술평균한 요약이며, pooled RMS와는 다르다.

| Task | L1 | L2 | L3 | L4 | L5 |
|---|---:|---:|---:|---:|---:|
| Original | 0.11061 | 0.12812 | 0.15900 | 0.18087 | 0.19220 |
| T01 | 0.09604 | 0.08918 | 0.07687 | 0.07637 | 0.07303 |
| T02 | 0.09258 | 0.08785 | 0.07869 | 0.08564 | 0.08475 |
| T03 | 0.09175 | 0.09209 | 0.07998 | 0.08646 | 0.09718 |
| T04 | 0.04365 | 0.04270 | 0.03792 | 0.03944 | 0.04830 |
| T05 | 0.05538 | 0.05621 | 0.06869 | 0.07085 | 0.06274 |

시점별 비율도 비원본 배경 13,500개 모두 ≥1이었고 undefined는 없었다. 선택한 작은 x-action 변화보다 배경 변화의 flow 차이가 컸다는 뜻이다. 서로 다른 perturbation 규모를 일반적으로 동등하게 맞춘 비교는 아니다.

공간 mask, 로봇 크기·자세, latent의 시간 혼합도 시점별 차이에 영향을 줄 수 있다. Flow 차이는 물리적 로봇 속도 오차나 action 정보 손실 자체를 뜻하지 않는다. Probe는 5개 시점의 공간 평균을 순서대로 유지하며, 시간축 평균을 하지 않는 기존 분석을 그대로 사용한다.

## 검증과 사이트

- 시점별 값으로 복원한 전체 RMS와 기존 RMS의 최대 절대 차이: `1.11e-16`.
- BG0의 배경 차이는 정확히 0. 모든 선택 시점의 mask가 비어 있지 않으며 paired background의 action과 mask가 일치한다.
- 사이트 `RMS future scope`: 전체 / L1–L5 선택. Robot Flow Difference, Denoising-Time Analysis, Background vs Action Ratio 곡선이 함께 바뀐다.
- 3번 섹션: 선택한 τ의 시점별 RMS·action RMS·비율 표. 4번: 세로 미래 L × 가로 denoising 진행도의 heatmap.
- 3번 공간 heatmap은 배경 flow 차이를 L1–L5 각각 표시한다. 8번은 A/B/C 각 행에 L1–L5 flow magnitude를 표시한다. 각 공간 위치에서 16채널 RMS를 계산하며 시간 평균은 하지 않는다. 회색은 해당 시점의 robot mask 밖이다.
- 공간 heatmap은 같은 task·seed·τ에서 5개 시점과 모든 배경에 동일한 색상 범위를 사용한다. A/B/C magnitude의 범위에는 action 대조군 C도 포함한다. 다른 τ의 색상 범위는 달라질 수 있으므로 범례 숫자를 확인한다. Probe와 5개 패널은 scope 선택과 무관하다.
- 시점별 공간 heatmap 재현: `scripts/temporal_heatmaps.py`; 원시 flow와 mask에서 생성한 5패널 PNG strip 및 범위 metadata는 `visualization/assets/temporal/`, `visualization/temporal_heatmaps.js`에 저장한다. 이전 시간 평균 figure 파일은 보존하되 사이트에는 시점별 패널을 사용한다.
- 재현 코드: `scripts/temporal_rms.py`. 결과: [CSV](../results/temporal_metrics.csv), [JSON](../results/temporal_metrics.json), [검증](../results/temporal_validation.json). Task별 PNG/PDF: `figures/09_temporal_rms_*`.
