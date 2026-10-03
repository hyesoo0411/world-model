# 분석 범위와 통제

사용자 선택은 `settled_v2`다. 기존 6 tasks, 16개 backgrounds, 3 seeds, canonical state, 40 raw actions, 두 카메라, 35-step schedule, history adapter를 보존한다. 변경할 새 배경은 만들지 않는다.

## 직접 flow 비교

주 분석은 첫 20-action model chunk다. BG0의 실제 denoising 경로에서 10개 sampler state를 저장하고 각 배경과 action control에서 다시 읽는다. BG별로 자유롭게 진행시킨 latent끼리 비교하지 않는다. BG0 재예측은 bitwise equality를 검사한다. 모델은 eval/inference mode이고 weights는 고정한다.

두 번째 autoregressive chunk에서는 기존 구현상 각 배경의 생성 결과가 새 관측/history로 들어간다. 이때는 관측의 로봇 자세까지 이미 달라질 수 있어 “물리 상태는 같고 배경만 다른 입력”이라는 직접 비교의 조건을 충족하지 않는다. 따라서 40-action 자유 rollout은 보조 진단이며 첫 chunk의 직접 효과와 구분한다. 전체 action 파일을 다른 action으로 바꾸거나 새로운 history 설정을 발명하지 않는다.

`xt`는 sampler 좌표, `z_t=xt/(1+sigma)`는 network의 미래 flow 좌표다. 두 텐서와 hashes를 저장한다. 관측 conditioning 슬롯은 모델이 배경별 observation latent로 교체하므로 미래 noisy 슬롯의 동일성을 통제하고 conditioning 슬롯은 주 metric에서 제외한다.

## Mask와 probe

Robot mask는 robot0_/gripper0_ MuJoCo geom segmentation이다. 모델 입력은 crop 없이 upright 256² RGB이므로 같은 격자에서 coverage를 계산한다. 실제 tokenizer의 첫-frame + 4-frame causal grouping, 8× spatial compression을 확인했다. Learned convolution/attention의 receptive-field 전체를 특정 로봇 cell로 엄밀히 분리할 수는 없다. Mask는 공간적 attribution이며 one-DiT-token dilation(출력 2 cells)과 coverage 0.25/0.5/0.75로 민감도를 본다.

Primary camera는 바뀐 벽이 보이는 agentview다. 두 view를 모델에 모두 공급하고 wrist와 전체 값은 따로 저장한다. Primary representation은 `[V*T,C]`의 시간 순서를 유지한다. 제외한 conditioning/wrist 슬롯은 0으로 남긴다. Temporal mean-pooling은 하지 않는다.

각 task의 공식 50 demonstrations에서 처음/마지막의 겹치지 않는 20-action window를 추출한다. Demonstration 단위 split: train 35, validation 7, test 8. 모든 window는 해당 task의 기존 settled canonical state에서 재생한다. 실제 demonstration 초기 상태에서의 성능으로 해석하지 않는다. Primary target은 정확한 raw `[20,7]`; model converter 출력 `[20,14]`도 함께 저장한다.

Probe는 BG0만으로 학습한다. Train 70/validation 14/test 16 windows. Test의 16개 배경을 paired 평가한다. Noise 경로는 해당 task의 canonical BG0 seed0 경로를 모든 action window에서 공유하므로 action 정답이 sample별 noisy latent에 섞이지 않는다. Mean/std와 action perturbation std는 training demonstration만 사용한다. Probe model/regularization/early stopping은 validation으로 선택한다.

Action별로 움직이는 robot mask 자체에 action 단서가 있을 수 있다. Mask-only, 고정 canonical temporal-mask flow, shuffled-label linear 대조군을 별도로 저장한다. 주 probe R²만으로 이 혼입을 무시하지 않는다. R²에서 분산 0 좌표는 undefined로 제외하고 개수를 보고한다.

## 작은 action 변화

Task별 training dataset std × epsilon 0.02/0.05/0.10. 하나의 action timestep(0)에서 x/y/z translation 또는 rotation-x 한 성분만 바꾼다. 입력 경계 [-1,1]를 넘을 경우 부호를 반대로 한다. Gripper는 demonstration에서 ±1 discrete 명령이므로 continuous sweep에서 제외한다. 공개 converter와 action-history path feature를 함께 다시 계산한다.

Ratio는 작은 단일 action 성분 변화에 대한 비교다. Background 전체 이미지 변화와 perturbation 크기가 물리적으로 등가라는 의미는 아니다. 분자/분모를 반드시 함께 제시한다. 분모 ≤1e-6은 undefined다. BF16 action 입력 hash와 실제 delta를 기록해 양자화에 따른 무응답을 확인할 수 있게 한다.

## Resource / reproducibility

새 simulator 환경: MuJoCo 3.3.2, robosuite 1.4.0, NumPy 1.26.4, OpenCV 4.11.0. 삭제된 기존 환경의 XML mesh 경로는 같은 길이의 alias로만 연결했다. 경로 차이 때문에 model buffer 크기가 바뀌지 않도록 했고, **어떤 fixed-model field도 검증에서 제외하지 않았다**. 6개 task 모두 원본 41-frame GT와 두 camera RGB가 bitwise 일치했다.

Slurm accounting은 비활성화 상태다. CPU RAM은 process VmHWM/rusage와 cgroup polling으로 기록한다. GPU VRAM은 별도 PyTorch allocated/reserved peak다. Child compiler process, page cache, allocator 밖 GPU 메모리에 대한 한계를 로그에 명시한다. 성공 pilot CPU HWM 19.90 GiB에 41% 여유로 production 28 GiB를 요청한다. Simulator는 실측 약 1.92–3.24 GiB, 요청 4 GiB였다. 모든 제출은 전체 사용자 RUNNING/active 수를 확인하며 4개 미만일 때만 허용한다.
