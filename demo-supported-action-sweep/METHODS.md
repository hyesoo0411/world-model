# EX19 — Demo-supported large-action downward sweep

목적은 **action 범위 밖으로 키우지 않아도 background 민감도가 action 크기와 함께 증가하는지** 확인하는 것이다. 이전 EX18과 결과를 합치지 않는다.

- 사용 가능한 6개 LIBERO task, 300개 demo의 **첫 20 actions**를 조사했다. Gripper를 제외한 6차원 arm action의 step별 L2 norm 평균과 RMS를 계산했다.
- P75–P95 범위, 원본 chunk의 global leave-one-out NN ≤ P75, 기존 native replay 오차가 작은 조건에서 5개 task의 서로 다른 원본 chunk를 선정했다. T05에는 해당 magnitude 범위의 first chunk가 없었다. Generated 결과는 선정에 사용하지 않았다.
- C01 Original/demo_6, C02 T01/demo_44, C03 T02/demo_34, C04 T03/demo_38, C05 T04/demo_36. 정확한 dataset 경로/index/percentile은 `config/selection.json`.
- 원본 demo XML과 `states[0]`을 복원했다. LIBERO의 `obs[0]`은 action0 **후** 관측이므로, action0 전 입력 영상은 복원한 state에서 직접 렌더했다. 다른 state에 action을 옮기거나 settling을 추가하지 않았다.
- Arm만 α = 0, .25, .5, .75, 1로 축소했다. Gripper는 원본 -1 유지. 실제 simulator/model 입력은 동일한 float32 raw action이며, 원본 float64도 보존했다. 최대 raw rounding은 4.77e-8. 모델의 공식 전처리: arm × .05, gripper (1-g)/2, 미사용 arm 0 padding. 실제 BF16 입력을 별도 저장하고 equality를 검증한다. Clipping은 없다.
- 원본 XML에서 rear-wall material/texture만 복제해 기존 EX8 BG0–BG3 RGB perturbation을 적용했다. 복제 전후 원본 영상은 픽셀 단위 동일하다. 질량·관성·camera·lighting 등 물리 모델 파라미터는 같다. BG pair의 simulator trajectory는 정확히 동일하다.
- 렌더링의 anti-aliasing으로 로봇 silhouette 경계에 소수 픽셀 차이가 생길 수 있다. 3픽셀 eroded robot interior는 동일하며, GT 영상을 background별로 추적해 이 영향까지 포함한 tracker 대조군을 측정했다. 두 camera의 150개 BG 비교에서 robot interior RGB 차이는 0이었다. 3픽셀 eroded non-wall/non-robot 영역에서는 1–2개 pixel에 최대 25/255의 미세 렌더 차이가 남았다(`results/full_background_nonwall_margins.json`). 그러므로 모든 non-wall pixel이 완전히 같다고 주장하지 않는다. 새 image compositing은 사용하지 않았다.
- α0에서도 원본 초기 속도/controller settling/gripper 동작이 남을 수 있다. 따라서 **물리적 no-op 실험이 아니며**, zero-arm 조건으로 해석한다. Native demo의 controller 내부 상태는 저장돼 있지 않아서 공식 `set_init_state` + `reset_goal`을 사용하고, α1 궤적을 저장된 post-action EE 관측과 대조했다.
- 3개 diffusion seeds, 16개 backgrounds, 5 scales, 5 bases = 1,200 generation conditions. 각 base의 α0/α1 seed0 BG0을 반복하여 10개 determinism controls를 추가한다.
- 공개 A2World first-chunk 경로를 재사용한다. 초기 관측 + 20 actions → 최초 미래 20 frames. 17개 반복 initial-frame history, 16개 zero-arm/valid-gripper history commands는 EX17/18과 동일하다. 생성 결과를 후속 관측/history로 넣지 않는다. 이 synthetic history의 conditional training support까지 입증하는 설계는 아니다.
- 동일 checkpoint, scheduler, paired initial noise를 사용한다. EX19 pilot CPU VmHWM 19.893 GiB → generation 28 GiB 요청(+41%). GPU PyTorch allocator peak 7.697 GiB는 별도. Tracker CPU HWM 1.26 GiB → 2 GiB. Native simulator는 scene에 따라 2.5–3.83 GiB, 최초 4 GiB 요청. C05는 margin이 작았지만 완료됐으며 같은 scene을 재실행하면 6 GiB가 필요하다.

## Empirical support

공식 float32 model arm 입력 [20,6]을 120차원으로 펼쳐 Euclidean NN distance를 계산한다. 모델에는 dataset z-score normalization이 없다. Gripper/padded arm은 거리에서 제외한다. 모든 α에서 해당 원본 base index를 검색에서 제외한다.

실제 demo 300개끼리의 leave-one-out NN 분포에 대해 ≤P75를 well-supported, P75–P95를 borderline, >P95를 weakly supported로 기술한다. 이는 **분포 내 상대적 거리 기준**이며 실제 IID/OOD 경계가 아니다. P50/P90, 동일 task 내 NN, positive α만의 supported 조건도 보조 분석한다. 전체 학습 데이터나 state-action joint support를 확인한 것은 아니다.

## Trajectory and flow

4개의 고정 hand-surface keypoints를 native robot segmentation 내부에서 선택한다. 초기 depth를 hand-body 좌표로 역투영하고 simulator body pose/camera를 적용해 GT oracle trajectory를 얻는다. CoTracker3 offline, window60, 21 frames를 사용한다. 미래 frame의 ≥95%에서 모든 point가 visible해야 수용한다. 멤버 교체나 trajectory interpolation은 없다.

Primary trajectory metric은 BG0와 BGb의 **손목 4-point centroid** 사이 평균 거리(px), t=1…20이다. Final/max, pointwise distance, image-diagonal normalization, generated motion, GT oracle ADE/FDE도 저장한다. GT/background tracking difference와 정적 반복 frame drift를 noise controls로 보고한다. Generated shape deformation은 추가 tracker error를 만들 수 있다.

실제 BG0 denoising path에서 step 0/16/35의 x와 sigma를 저장한다. 각 α·seed에서 모든 BG에 **같은 x, timestep, action**을 입력해 raw conditional DiT velocity를 비교한다. BG0의 재계산 velocity는 원본 capture와 정확히 같아야 한다. Step0 x는 α 간에도 같고, middle/late BG0 path는 α에 따라 달라진다.

Robot-associated future-agentview latent ROI의 RMS difference가 primary flow metric이다. α1 고정 ROI, 전체 future agentview, far-background ROI, normalized difference/cosine도 저장한다. 이 영역의 flow 차이가 곧 물리적 robot motion이라는 해석은 하지 않는다.

## Statistics

Background 3개를 seed별 평균하고, seed 3개를 base별 평균한다. Base×α 평균 25개를 주 분석 단위로 사용한다. 개별 state 곡선과 well-supported subset을 우선 보고한다. Pooled 및 within-base-centered Pearson/Spearman을 함께 저장한다.

크기와 NN distance의 설명력을 비교하기 위해 base 평균을 제거한 후 두 변수의 단독/동시 회귀 및 leave-one-base-out RMSE를 보조적으로 계산한다. 이는 5개 base뿐인 탐색적 비교이며 인과 분석이 아니다. 변동성은 base 간 SD, base별 seed SD, base-cluster bootstrap percentile interval로 표시한다. Background/seed/α를 독립 샘플처럼 세어 p-value를 만들지 않는다.

C05에서는 원본 object settling이 관측되어 해당 base를 제외한 민감도 분석도 저장한다. State 보존을 위해 객체를 인위적으로 고정하지 않았다. EX18 비교는 다른 settled state라는 차이를 유지하여 별도 panel로 제시한다.

## Checkpoint provenance

- A2World: `Fleurrr/A2World-World-Model`, revision `411846321a75f1b64af2ab79af3db939c85d6a72`, `a2world-libero.pt`.
- VAE: `nvidia/Cosmos-Predict2-2B-Video2World`, revision `f50c09f5d8ab133a90cac3f4886a6471e9ba3f18`, `tokenizer/tokenizer.pth`.
- 실제 경로는 Hugging Face 기본 cache `HF_CACHE/hub/`의 해당 repository snapshot이다. 프로젝트 안에 checkpoint를 복제하지 않았다. 각 case의 `data/model_provenance_seed*.json`에 checkpoint metadata와 scheduler 설정을 저장했다.
- 완료된 generation 3 jobs의 CPU VmHWM은 19.891–19.896 GiB, 요청은 28 GiB였다. PyTorch GPU allocator peak는 7.747 GiB다. Slurm MaxRSS는 제공되지 않아 프로세스 HWM과 cgroup 기록을 사용했다. Simulator의 GPU 메모리는 PyTorch allocator로 측정할 수 없다.

## 전체 배경 확장

EX8의 16개 background 정의를 `config/backgrounds.json`에 그대로 저장했다. 기존 BG0–BG3 입력과 결과는 `baseline_BG0_BG3/`에 보존했다. 추가 배경의 GT를 기존 BG0와 매 step 비교하여 모든 state 배열이 정확히 같은지 검증했다. 원본 robot 내부 RGB, actions, query points, GT 및 flow 기준값을 유지한다. 12개 추가 BG의 생성에는 같은 noise를 재사용하고 local flow에는 기존 BG0 reference latent를 재사용한다. BG1–3 / mild BG1–4 / strong BG5–9 / matched-color BG10–15 / 전체 BG1–15를 구분한다. EX18 비교 그림은 양쪽 BG1–3로 맞춘다.

Simulator는 task별 독립 프로세스로 실행한다. 초기 연속 task 시도에서 upstream task metadata cache 충돌이 발생하여 두 번째 task의 XML 복원이 실패했다. 첫 task의 완료 결과를 보존하고 나머지 task는 독립 프로세스로 재개했다. 실패한 환경의 결과를 분석에 사용하지 않았다. CPU HWM은 task별 2.47–3.76 GiB였고 요청량은 6 GiB였다. 생성은 기존 HWM 19.90 GiB에 근거해 28 GiB를 요청했다. CoTracker를 같은 allocation에서 함께 실행한 경우 별도 프로세스 HWM 및 cgroup 사용량을 저장한다. 사용자 RUNNING job 수는 최대 4개다.

공유 allocation의 CoTracker CPU VmHWM snapshot은 1.276 GiB였으며 해당 generation job 종료 후 미완료 추적은 2 GiB 요청으로 재개했다. 기존 파일을 재사용하고 새 추적 파일은 atomic rename으로 저장했다. 새 C05 생성 worker의 CPU HWM은 19.895 GiB, GPU PyTorch allocator peak는 7.789 GiB였다. `logs/tracker_shared_resource_snapshot.json`의 nvidia-smi 값은 별도의 실제 GPU 사용량 snapshot이며 CPU RAM 수치가 아니다.
