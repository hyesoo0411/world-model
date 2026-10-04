# Early / Late Robot-Flow Intervention

Status: PRIMARY COMPLETE (1890/1890 primary conditions tracked).

같은 배경 변화가 만든 로봇 flow를 초기 또는 후기에 BG0 방향으로 교정해 최종 궤적이 복원되는지 검사했다. 같은 현재 latent에서 BGb와 BG0 flow를 계산하고 로봇 영역만 교체했다. 초기 물리 상태·action·noise·모델·스케줄은 동일하다.

**현재 답:** Early 교정은 평균 5.1059% 회복을 보였다. Paired Early−Late 차이는 4.8933%p, 95% CI [-0.3023, 9.7212]%p이다. Early가 더 효과적이라는 결론은 아직 확정할 수 없다. 이 결과는 지정한 robot mask 개입의 제한적인 회복을 뜻하며, 큰 복원이나 early-dominant 인과 기전을 확정하지 않는다. Early 이후 BG0로 전환하면 평균 71.99% 회복, 반대 전환은 14.31% 회복이었다. 이는 early 배경의 지속적 우위를 지지하지 않는다. 전체 conditioning 및 Middle+Late 구간을 함께 바꾸는 보조 개입이므로 late-only robot 교정과는 별도로 해석한다.

| 질문 | 답 | 직접 근거 |
|---|---|---|
| Q1. Early correction reduces BG drift | YES | mean 0.0511, 95% CI [0.0133, 0.0952], n=269 |
| Q2. Early is better than late | INCONCLUSIVE | mean 0.0489, 95% CI [-0.0030, 0.0972], n=269 |
| Q3. Full is stronger than stage-specific correction | INCONCLUSIVE | Full−Early mean 0.0101, 95% CI [-0.1270, 0.1157], n=269; Full−Middle mean -0.0471, 95% CI [-0.1140, 0.0057], n=270; Full−Late mean 0.0588, 95% CI [-0.0773, 0.1730], n=270 |
| Q4. Spatial specificity to the robot region (early comparison) | YES | Early robot − early far-background recovery: mean 0.0529, 95% CI [0.0152, 0.0961], n=269; Full robot − full far-background: mean 0.0829, 95% CI [-0.0765, 0.1980], n=268; region sizes and intervention magnitudes differ. |
| Q5. Larger early drift predicts greater benefit | INCONCLUSIVE | Task-demeaned Spearman mean 0.1841, 95% CI [-0.0221, 0.4402], n=269; association is not mediation. |
| Q6. Early correction reduces MuJoCo GT error | YES | BGb ADE minus early ADE (positive=improvement, px): mean 0.0634, 95% CI [0.0070, 0.1660], n=269 |
| Q7. Subsequent mean robot latent distance to BG0 decreases | YES | Post-early positions12–35 mean normalized-z distance reduction: mean 0.0025, 95% CI [0.0013, 0.0042], n=270 |
| Q8. Background switching supports early influence | NO | BG0 preference=(D_to_BGb−D_to_BG0)/D_BG (positive=closerBG0): BGb→BG0 mean 0.5808, 95% CI [0.4884, 0.6914], n=270; BG0→BGb mean -0.5357, 95% CI [-0.7222, -0.3450], n=269; paired difference mean -1.1152, 95% CI [-1.4144, -0.8324], n=269 |
| Q9. Evidence for a causal contribution (measured2D trajectory) | YES | Limited YES for the measured2D hand-trajectory proxy: early correction improves mean recovery, exceeds the early far-background control, and reduces subsequent latent distance. This supports a modest causal contribution under the tested mask. Early superiority, full mediation and3D action realization are not established. |

## 궤적 결과

Recovery=1−D_int/D_BG. 아래 거리는 공통 유효 future frame에서 측정한 pixel 단위 평균이며, GT ADE는 MuJoCo 투영 궤적에 대한 오차다.

| 조건 | n | D_BG px | D_int px | Recovery 평균 | 중앙값 | GT ADE px |
|---|---:|---:|---:|---:|---:|---:|
| baseline | 270 | 1.4635 | 1.4635 | 0.0000 | 0.0000 | 2.2938 |
| early | 269 | 1.3747 | 1.2983 | 0.0511 | 0.0500 | 2.1384 |
| middle | 270 | 1.4635 | 1.2865 | 0.1079 | 0.1321 | 2.1605 |
| late | 270 | 1.4635 | 1.4627 | 0.0020 | 0.0165 | 2.2998 |
| full | 270 | 1.4635 | 1.2015 | 0.0608 | 0.1846 | 2.0817 |
| background_early | 270 | 1.4635 | 1.4645 | -0.0018 | 0.0007 | 2.2941 |
| background_full | 268 | 1.2851 | 1.2763 | -0.0214 | 0.0016 | 2.1215 |
| switch_bg_to_ref | 270 | 1.4635 | 0.2221 | 0.7199 | 0.7661 | 1.2031 |
| switch_ref_to_bg | 269 | 1.3778 | 1.1389 | 0.1431 | 0.1137 | 2.0213 |

## Task별 결과

조건별 평균은 각 유효 표본, Early−Late와 n paired는 공통 유효 frame·표본 기준이다.

| Task | n paired | Early | Middle | Late | Full | Early−Late |
|---|---:|---:|---:|---:|---:|---:|
| Original | 44 | 0.0641 | 0.0082 | -0.0016 | 0.0526 | 0.0652 |
| T01 | 45 | -0.0051 | -0.0280 | 0.0551 | -0.0140 | -0.0603 |
| T02 | 45 | 0.0599 | 0.2023 | 0.0082 | 0.1793 | 0.0517 |
| T03 | 45 | 0.0392 | 0.1800 | -0.0991 | 0.0810 | 0.1384 |
| T04 | 45 | 0.0059 | -0.0911 | -0.0633 | -0.2730 | 0.0692 |
| T05 | 45 | 0.1427 | 0.3762 | 0.1130 | 0.3390 | 0.0297 |

## 결과 해석

Early recovery: mean 0.0511, 95% CI [0.0133, 0.0952], n=269. Late recovery: mean 0.0020, 95% CI [-0.0574, 0.0571], n=270. Recovery는 BG0 모델 궤적에 가까워진 비율이며, 양수가 이득이다. MuJoCo ADE 개선은 별도로 보고한다.

관측된 교정 효과는 지정한 soft robot mask 및 stage 범위에 대한 개입 효과이다. 작은 효과가 로봇 flow의 모든 인과 영향이 없음을 뜻하지 않는다. 배경/물체/다른 view의 표현, mask 밖으로 이동한 생성 로봇, tokenizer 공간·시간 혼합을 통해 영향이 남을 수 있다. Full 교정도 전체 모델 상태를 BG0로 바꾸지는 않는다. 결과는 첫20 future frame의 2D 손 표면 query 중심에 대한 것이며, 손의 외형 변화가 추적점에 영향을 줄 가능성과 3D 관절 운동 전체는 분리해 해석해야 한다. Early를 motion planning이라고 부르지 않는다.

## 고정 설정 및 품질 관리

추적 또는 paired visibility 검증에 실패한 조건 수: 4. 해당 metric은 제외/undefined로 기록하며 영상 frame을 보간하지 않았다.

- A2World checkpoint/revision/git commit: [model provenance](docs/model_provenance.json). Existing cached weights only.
- EX2 settled_v2: 6 tasks, BG0–BG15, seeds0–2. First20 actions; two model views; robot intervention only agentview future latent1–5.
- Actual flow evals0–35. Early0–11 / middle12–23 / late24–35. Step35 is final denoise for decoder. AB2 history continues without reset.
- Existing temporal RGB segmentation coverage is the soft intervention mask. Coverage≥0.5 is the unchanged metric mask. Soft boundaries are partial correction even at α=1.
- BG0/BGb baseline decoded pixels must match cached EX2 videos exactly. BG0 identity must preserve latent path exactly. On every paired forward, current tensor and RNG must remain identical.
- EX2 MuJoCo full GT arrays are exactly equal across16 backgrounds (96 checks). Same camera and projection oracle; no physics rerun required.
- Existing CoTracker3 / fixed hand-surface queries. Uniform21-frame input for all conditions; do not mix prior41-frame offline tracker outputs. All points visible on≥95% futureframes; no failure interpolation. Uncalibrated confidence is exported and does not prove correctness.
- Primary unit task/seed/background. Task bootstrap1000, six task clusters. Per-task results and paired contrasts saved; frames are not independent samples.
- Stage windows contain12 flow evaluations each but are not matched for integrated update magnitude. Spatial controls also differ in region size; they test this specified intervention, not an exhaustive localization of all robot information.
- Only six task clusters are available; bootstrap intervals and stage/mechanism comparisons are descriptive and are not evidence of broad task generalization.
- Near-zero baseline drift≤1e-4px yields undefined Recovery. D_BG and D_int always accompany it. Far-background mask excludes two output-grid cells around any robot coverage; mask sizes differ.

[Protocol](configs/protocol.json) · [Trajectory CSV](results/trajectory_metrics.csv) · [Paired CSV](results/paired_early_late.csv) · [Correlations](results/mechanism_correlations.csv) · [Previous site](https://hyesoo0411.github.io/world-model/visualization/)


## Flow drift ↔ recovery

기존 normalized flow drift와 새 개입 회복률의 관계다. 아래 CI는 task bootstrap이며, 이 상관을 인과 매개 효과로 해석하지 않는다. Task별 수치는 correlation CSV와 사이트에서 제공한다.

| Scope | Original flow | Recovery | n | Spearman ρ (95% CI) | Pearson r (95% CI) |
|---|---|---|---:|---|---|
| pooled | D_flow_early | Recovery_early | 269 | 0.2923 [0.1002, 0.4307] | 0.1850 [0.0138, 0.3922] |
| pooled | D_flow_early | Recovery_late | 269 | -0.0766 [-0.2362, -0.0133] | -0.0085 [-0.1166, 0.0851] |
| pooled | D_flow_late | Recovery_early | 269 | -0.0621 [-0.3310, 0.1967] | -0.0116 [-0.2819, 0.2840] |
| pooled | D_flow_late | Recovery_late | 269 | -0.1630 [-0.4013, 0.0375] | -0.1271 [-0.2904, 0.0369] |
| task_demeaned | D_flow_early | Recovery_early | 269 | 0.1841 [-0.0221, 0.4402] | 0.1177 [-0.0231, 0.3851] |
| task_demeaned | D_flow_early | Recovery_late | 269 | -0.1129 [-0.2473, -0.0173] | -0.0358 [-0.1514, 0.0286] |
| task_demeaned | D_flow_late | Recovery_early | 269 | 0.1108 [-0.0341, 0.2241] | 0.1713 [-0.0055, 0.2935] |
| task_demeaned | D_flow_late | Recovery_late | 269 | -0.1391 [-0.3215, -0.0257] | -0.1419 [-0.2834, -0.0543] |

## Tracking QC 제외

Confidence와 visibility는 별도 출력이다. 고정 query가 모두 visible인 future frame≥95% 기준을 유지했다.

| Task | Seed | BG | Condition | Valid future fraction |
|---|---:|---|---|---:|
| Original | 0 | BG8 | background_full | 0.90 |
| Original | 2 | BG8 | background_full | 0.70 |
| Original | 2 | BG8 | early | 0.85 |
| Original | 2 | BG8 | switch_ref_to_bg | 0.80 |

## 실제 flow 교정량

기존 EX9 drift feature는 공통 BG0 latent 경로의 값이고, 실제 교정량은 각 개입의 현재 latent에서 측정했다. 아래 감소율은 active step별1−after/before의 평균이다. Flow 검증에는 추적 QC와 무관하게270개 case를 포함한다. Soft 경계에서는 잔여 차이가 남는다.

| 조건 | cases | Before RMS | After RMS | 평균 상대 RMS 감소 |
|---|---:|---:|---:|---:|
| early | 270 | 0.1059 | 0.0197 | 78.1982% |
| middle | 270 | 0.0945 | 0.0204 | 76.1050% |
| late | 270 | 0.1147 | 0.0255 | 76.6943% |
| full | 270 | 0.1049 | 0.0219 | 76.9342% |

## Optional α sweep

고정된 BG8 / seed0, 6 tasks의 보조 결과이다. 단조 여부는 인접 α의 Recovery가 감소하지 않는지 검사한 기술 통계이며, 허용 오차는1e-6이다.

| Task | α=0 | 0.25 | 0.50 | 0.75 | 1.00 | 단조 증가 |
|---|---:|---:|---:|---:|---:|---|
| Original | 0.0000 | 0.0007 | 0.0011 | 0.0024 | 0.0033 | YES |
| T01 | 0.0000 | -0.0035 | 0.0044 | 0.0114 | -0.0223 | NO |
| T02 | 0.0000 | 0.0132 | 0.0279 | 0.0417 | 0.0547 | YES |
| T03 | 0.0000 | 0.0157 | 0.0342 | 0.0477 | 0.0629 | YES |
| T04 | 0.0000 | 0.0333 | 0.0559 | 0.0748 | 0.0833 | YES |
| T05 | 0.0000 | 0.0465 | 0.1314 | 0.1840 | 0.2482 | YES |

유효한 6개 task 중 5개가 단조 증가를 보였다. 이 제한된 배경·seed 범위를 전체 조건의 dose-response로 일반화하지 않는다.

## 작은 baseline drift에 대한 민감도

전체 표본의 primary 결과를 유지한다. 1px/5px는 추적 정확도 기준이 아닌 보조 cutoff이며, 유리한 cutoff만 고르지 않는다. Absolute advantage는 D_late−D_early로, 양수가 early의 이득이다.

| 최소 D_BG px | n | tasks | Early−Late Recovery (95% CI) | Absolute advantage px (95% CI) |
|---:|---:|---:|---|---|
| 0 | 269 | 6 | mean 0.0489, 95% CI [-0.0030, 0.0972], n=269 | mean 0.0733, 95% CI [0.0081, 0.1822], n=269 |
| 1 | 47 | 4 | mean 0.0638, 95% CI [0.0517, 0.1174], n=47 | mean 0.3603, 95% CI [0.1129, 0.4305], n=47 |
| 5 | 19 | 1 | mean 0.0501, 95% CI [undefined, undefined], n=19 | mean 0.6701, 95% CI [undefined, undefined], n=19 |

추적 입력 길이 진단: 동일한 baseline 영상의 첫20 frame에서, 기존41-frame offline 추적과 새21-frame 추적 사이 centroid 차이는 평균 0.0434px이다. 모든 개입 비교는 새21-frame 추적끼리만 수행한다. 이 차이를 tracker의 정답 대비 정확도로 해석하지 않는다.

## 실행 자원

생성 작업은 CPU RAM28GiB를 요청했고 최대 프로세스 HWM은 19.90GiB였다. GPU PyTorch allocator peak는 별도로 7.75GiB이다. 추적 작업은 CPU RAM2GiB 요청, 최대 HWM 1.28GiB였다. 생성 요청량은 pilot19.89GiB에 약41% 여유를 둔 값이다.

Slurm accounting이 비활성화되어 프로세스 HWM과 cgroup을 기록했다. Cgroup current에는 page cache가 포함되며 polling은 일부 순간 사용량을 놓칠 수 있다. GPU 수치는 전체 장치 사용량이 아닌 PyTorch allocator 계측이다. [Resource CSV](results/resource_usage.csv)