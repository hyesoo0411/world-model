# 정규화한 robot flow 차이

**현재 답:** “초기/high-noise 단계가 더 민감하다”는 패턴은 Original과 T05에서 정규화 후에도 유지되지만, 모든 task의 공통 경향은 아니다. 6-task 평균은 정규화 후 초기와 후반이 거의 같다. 배경에 따른 두 flow의 차이는 주로 latent 벡터 방향 차이이며, 단순한 전체 크기 배율 변화만으로 설명되지 않는다.

## 실험

확인하려는 것은 초기 raw flow 차이가 큰 이유가 flow 자체의 큰 크기 때문인지다. 기존 6 tasks × 3 seeds × 16 backgrounds × 10 τ의 저장된 paired flow와 robot mask를 그대로 재사용했다. 같은 action·물리 상태·실제 x_τ에서 배경만 바꾼 예측이다. 모델 재추론은 하지 않았다. 주 영역은 agentview future L1–L5의 robot mask이며 각 L별 결과도 저장했다.

```text
D_raw = RMS_selected(v_b − v_ref)
M_ref = RMS_selected(v_ref); M_b = RMS_selected(v_b)
D_norm = D_raw / (0.5 × (M_ref + M_b) + 1e-8)
CosSim = dot(vec(v_ref|robot), vec(v_b|robot)) / (||v_ref|robot|| × ||v_b|robot||)
```

RMS의 분모는 선택된 robot 위치 × 채널 수다. Mask 밖의 0은 분모에 포함하지 않는다. Cosine은 같은 선택 영역을 flatten하여 계산했다. Float64로 통계량을 계산했다. BG0 자체 비교는 D_raw=D_norm=0, CosSim=1이다.

ε는 1e-08, 관측된 최소 평균 flow 크기는 0.593299로 ε의 상대 영향은 최대 1.69e-08다. Zero-norm case는 없었다.

## 초기 > 후반 패턴

초기는 progress≤1/3의 저장 step 0·4·8, 후반은 progress≥2/3의 step 27·31·35로 정의했다. 평균은 BG1–BG15, seeds 0–2와 각 구간의 3개 시점에 동일 가중치를 준다. 각 case를 먼저 정규화하고 평균했다. Mean(flow)를 먼저 구한 뒤 정규화하지 않았다. Raw/normalized 숫자는 서로 단위가 다르므로 각각의 초기/후반 비율로 비교한다.

| Task | Raw 초기 / 후반 | Normalized 초기 / 후반 | 정규화 초기÷후반 | 유지? |
|---|---:|---:|---:|---|
| Original | 0.23760 / 0.09061 | 0.20874 / 0.10480 | 1.992 | YES |
| T01 | 0.07424 / 0.10129 | 0.06465 / 0.11385 | 0.568 | NO |
| T02 | 0.09114 / 0.08969 | 0.07998 / 0.10277 | 0.778 | NO |
| T03 | 0.08990 / 0.09777 | 0.07921 / 0.11148 | 0.711 | NO |
| T04 | 0.04645 / 0.05007 | 0.03989 / 0.05652 | 0.706 | NO |
| T05 | 0.09755 / 0.05872 | 0.08470 / 0.06703 | 1.264 | YES |
| ALL_TASKS | 0.10615 / 0.08136 | 0.09286 / 0.09274 | 1.001 | 거의 동일 |

**관측 → 의미:** Original은 정규화 후에도 초기 차이가 약 1.99배, T05는 약 1.26배다. 이 두 task에서는 큰 절대 flow 크기만으로 초기 민감도를 설명할 수 없다. 반면 전체 평균은 0.09286 vs 0.09274로 사실상 평평하다. 전체에 대해 초기 민감도가 더 크다는 일반화는 지지하지 않는다. ALL_TASKS의 1.001배 차이는 의미 있는 우세라는 판정이 아니다.

Task·seed·배경별 270개 곡선 중 raw 초기>후반은 121개, 정규화 후에는 73개다. Raw 패턴을 유지한 것은 73개다. 이는 독립 표본 유의성 검정이 아닌 관측 조건의 기술 통계다.

## 크기 변화인가, 방향 변화인가

CosSim이 1에 가깝다는 사실만으로 차이가 주로 크기 변화라고 판단할 수는 없다. 두 flow의 전체 크기가 거의 같으면 작은 각도 차이도 오차의 대부분을 설명할 수 있다. 다음 항등식으로 두 성분을 추가 확인했다.

```text
D_raw² = (M_ref − M_b)² + 2 M_ref M_b (1 − CosSim)
           크기 차이 항          방향 차이 항
```

비원본 배경 전체 primary 측정에서 squared difference의 **99.81%**가 방향 차이 항이다(항의 합으로 가중). 여기서 방향은 공간·시간·채널을 flatten한 latent flow 벡터의 방향이며, 물리적 로봇의 이동 방향을 뜻하지 않는다.

| Original · seed 0 · BG8 | D_raw | M_ref | M_b | D_norm | CosSim |
|---|---:|---:|---:|---:|---:|
| step 0 | 0.48971 | 1.12882 | 1.13302 | 0.43302 | 0.90625 |
| step 16 | 0.54027 | 1.12958 | 1.12868 | 0.47848 | 0.88553 |
| step 35 | 0.09543 | 0.65612 | 0.65131 | 0.14598 | 0.98937 |

이 예시에서 초기 두 flow의 크기는 거의 같지만 CosSim은 약 0.906이다. 마지막에는 약 0.989로 가까워진다. 따라서 초기 BG8 효과는 단순 크기 배율 변화 이상의 방향 차이를 포함한다.

## 가장 강한 배경

아래 순위는 각 task·seed·10개 τ에 동일 가중치를 준 D_norm 평균이다. τ 간격에 대한 적분 순위가 아니다.

| 집계 | 순위 | 기존 background | 평균 D_norm |
|---|---:|---|---:|
| ALL_TASKS | 1 | BG8 · HIGH_CONTRAST_CHECKER | 0.14877 |
| ALL_TASKS | 2 | BG10 · WARM_MATCHED_CHECKER | 0.14142 |
| ALL_TASKS | 3 | BG6 · BURNT_ORANGE | 0.12698 |
| Original | 1 | BG10 · WARM_MATCHED_CHECKER | 0.30647 |
| Original | 2 | BG8 · HIGH_CONTRAST_CHECKER | 0.30042 |
| Original | 3 | BG6 · BURNT_ORANGE | 0.26067 |

## 해석의 범위와 출력

정규화는 전체 flow scale 차이를 조정한다. Robot mask의 위치·tokenizer 혼합이나 task별 차이까지 제거하지는 않는다. 모든 비교는 공통 BG0 latent 경로 위의 조건 민감도이며 독립 rollout 간 최종 차이는 아니다. Early/high-noise와 Late/low-noise로만 부르며 motion planning 단계라고 확정하지 않는다.

- [전체 수치 CSV](../results/normalized_flow_metrics.csv): 17,280개 row, all/L1–L5, raw·크기·정규화·cosine·방향 성분·pairing hash.
- [배경 평균 CSV](../results/normalized_background_means.csv): BG0–BG15 / BG1–BG15 모두 제공. 사이트 기본 점선은 요청한 전체 16배경 평균이다.
- [초기/후반 CSV](../results/normalized_stage_comparison.csv), [배경 순위 CSV](../results/normalized_background_ranking.csv).
- [계산 검증](../results/normalized_flow_validation.json), figure PNG/PDF `figures/12_normalized_flow_*` (task별 및 전체, seeds 평균).
- 코드: `scripts/normalized_flow.py`, `scripts/write_normalized_report.py`; 사이트 3A raw와 3B before/after 비교.
