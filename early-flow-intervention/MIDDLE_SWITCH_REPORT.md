# Middle-only background switch

질문: Early·Late는 BGb로 유지하고 Middle에서만 BG0 관측을 사용하면, 최종 로봇 궤적이 BG0 방향으로 회복되는가?

전체 관측 조건을 양 카메라에서 바꾼다. Robot-mask flow 교체는 없다. 같은 action·초기 noise·모델·물리 상태·camera·schedule을 사용한다. 현재 latent와 AB2 history는 전환 때 리셋하지 않는다. 기존 BG0·BGb baseline과 Early-only·Late-only 결과를 재사용하고 Middle-only270개만 새로 생성했다.

| 조건 | Early0–11 | Middle12–23 | Late24–35 |
|---|---|---|---|
| BGb baseline | BGb | BGb | BGb |
| Early-only | BG0 | BGb | BGb |
| Middle-only | BGb | BG0 | BGb |
| Late-only | BGb | BGb | BG0 |
| BG0 reference | BG0 | BG0 | BG0 |

**Q1. Middle-only의 평균 회복률은 양수인가? YES.** 평균 43.15% [task-bootstrap95% CI [24.75, 59.54]]%, 중앙값 57.58%, n=270.
**Q2. BG0까지의 실제 픽셀 거리가 감소하는가? YES.** 평균 감소 1.2059px [95% CI [0.13, 3.22]]px. 평균 D_BG=1.4635px, D_int=0.2576px.
**Q3. Early-only보다 회복이 큰가? YES.** paired Middle−Early 28.64%p [95% CI [13.14, 45.55]]%p, n=269.
**Q4. Late-only보다 회복이 큰가? YES.** paired Middle−Late 36.25%p [95% CI [13.94, 55.50]]%p, n=269.
**Q5. MuJoCo GT 오차도 개선되는가? YES.** 평균 GT ADE 감소 1.0661px [95% CI [0.02, 3.11]]px.

| 조건 | n | D_BG px | D_int px | 평균 회복 % | 중앙값 % | 95% CI % | GT ADE px |
|---|---:|---:|---:|---:|---:|---|---:|
| Early-only | 269 | 1.3778 | 1.1389 | 14.31 | 11.37 | [3.57, 24.56] | 2.0213 |
| Middle-only | 270 | 1.4635 | 0.2576 | 43.15 | 57.58 | [24.75, 59.54] | 1.2276 |
| Late-only | 270 | 1.4635 | 1.4550 | 6.66 | 5.28 | [0.67, 13.50] | 2.2987 |

회복률 = 1 − D_int/(D_BG+ε). D_BG는 BGb와 BG0의 평균 궤적 거리, D_int는 개입 영상과 BG0의 거리다. 각 표본의 회복률을 계산한 뒤 평균하므로 평균 거리의 비율과 다르다. nADE는 평균 GT 위치 오차를 영상 대각선으로 나눈 값이다. BG0는 모델 기준 궤적이며 물리 GT가 아니다.

작은 baseline 검토: D_BG≥1px인 48개 표본의 Middle 회복은 76.41% [95% CI [62.69, 79.43]]%. 해당 검정은 YES이다. 작은 픽셀 변화는 tracker 반응이나 생성 외형 변화일 수 있으므로 Recovery만으로 실질적인 운동 회복을 단정하지 않는다.

핵심 해석: Middle-only 개입은 최종 생성 손 궤적을 BG0 쪽으로 회복시킨다는 증거가 있다. 회복률뿐 아니라 실제 픽셀 거리 감소도 task-bootstrap 신뢰구간에서 양수다. Middle에 제공한 BG0 관측의 영향이 Late에서 BGb로 돌아간 뒤에도 남는다는 가설을 지지한다.
동일 표본의 단계 비교에서도 Middle-only의 회복이 Early-only와 Late-only보다 크다. 이번 설정에서는 Middle 전환이 가장 효과적이라는 근거다. 다른 단계의 효과가 없다는 뜻은 아니다.
원래 차이가1px 이상인 표본에서도 회복이 유지되어, 전체 결과가 작은 baseline의 비율 효과만으로 생겼다는 설명과는 맞지 않는다.
MuJoCo GT 오차 개선도 관측됐다.
Task별로는 차이가 있다. T01에서는 Late-only 회복16.53%가 Middle-only5.30%보다 컸다. 따라서 Middle 우위는 전체 평균에 대한 결론이다.
GT 오차의 평균 개선은 Original task에 주로 집중됐다(Original6.166px, T01−0.028px). 모든 task의 물리 정확도가 개선됐다는 뜻은 아니다.

다른 설명과 한계: 각 단독 구간은12회 DiT 평가지만, Early/Middle은12회 AB2 update이고 Late는11회 update와 최종 clean 평가다. Noise 수준과 실제 적분된 flow 변화량도 다르므로 동일한 개입량의 비교는 아니다. Whole observation은 두 view 전체에 영향을 줄 수 있다. 단계 간 상호작용 때문에 단독 개입 결과만으로 모든 원인을 설명할 수 없다.6개 task·3개 seed와 task별 기존20-step action chunk1개의 범위에서 해석한다. 측정은2D 손 추적이다. 픽셀 단위 회복은 3D 물리 정확도의 증명이 아니다.

| Task | Early 회복 % | Middle 회복 % | Late 회복 % | paired M−E %p | paired M−L %p |
|---|---:|---:|---:|---:|---:|
| Original | 27.53 | 69.07 | 0.82 | 40.92 | 67.49 |
| T01 | 3.77 | 5.30 | 16.53 | 1.53 | -11.23 |
| T02 | 19.29 | 34.45 | -3.15 | 15.16 | 37.60 |
| T03 | 7.14 | 34.49 | 6.93 | 27.35 | 27.56 |
| T04 | -3.54 | 64.01 | 1.77 | 67.55 | 62.25 |
| T05 | 31.98 | 51.55 | 17.03 | 19.57 | 34.52 |

| 최소 D_BG | Middle n | task 수 | Middle 회복 % | 95% CI % |
|---|---:|---:|---:|---|
| 0px | 270 | 6 | 43.15 | [24.75, 59.54] |
| 1px | 48 | 4 | 76.41 | [62.69, 79.43] |
| 5px | 20 | 1 | 88.84 | 산출하지 않음 (task1개) |

QC 제외: 1개 조건별 표본. Middle 단독 효과는 BG0·BGb·Middle의 공통 유효 frame, 단계 간 차이는 다섯 조건 전체의 공통 유효 frame에서 측정한다.95% 미만 유효 frame인 표본은 제외하며 실패를 보간하지 않는다. 통계 단위는 task/seed/background이며1,000회 bootstrap에서 task를 재표집했다. Per-task CI는 task1개이므로 산출하지 않는다. 태스크 간 일반화의 불확실성을 고려해야 한다.

구현 검증: step12 직전까지 BGb baseline과 동일한 latent, step24 직전까지 기존 BGb Early→BG0 Middle+Late 조건과 동일한 latent임을 검사한다. 이후 BGb로 돌아가며 final conditioning frame도 BGb임을 확인한다. 모든 구간에서 masked flow 교체가 없고 action/noise/schedule/physical-camera control hash가 같다.

| 자원 | 요청 CPU RAM GiB | 실측 CPU VmHWM GiB | GPU allocator GiB |
|---|---:|---:|---:|
| A2World | 28.00 | 19.893 | 7.717 |
| CoTracker | 2.00 | 1.250 | 1.911 |

Slurm accounting은 비활성이므로 CPU 측정은 process VmHWM이다. GPU allocator 값은 전체 GPU 사용량과 다르다. 기존 Hugging Face 기본 캐시의 동일 A2World checkpoint/tokenizer를 재사용했다.
