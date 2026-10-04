# Action calibration 기준

Raw LIBERO action은 `[20,7]`: x/y/z translation, axis-angle rotation 3개 성분, gripper다. 각 continuous 명령의 유효 입력 범위는 `[-1,1]`이다. Gripper는 demonstration의 ±1 이산 명령이므로 연속 sweep에서 제외했다.

검증한 소스:

- `EX1/vendor/LIBERO/libero/libero/envs/env_wrapper.py`: 기본 controller `OSC_POSE`.
- `EX8/runtime/simvenv/lib/python3.10/site-packages/robosuite/controllers/config/osc_pose.json`: fixed impedance, delta control, input ±1. 기본 goal scaling은 translation ±0.05, rotation ±0.5.
- 같은 패키지의 `controllers/osc.py::set_goal`, `utils/control_utils.py::set_goal_orientation`: 앞 3개는 position goal delta, 뒤 3개는 axis-angle orientation goal delta.
- `EX1/vendor/A2World/world_model/a2world/actions.py::libero_servo_actions`: 7→14 padding, 첫 팔 gripper `(1-g)/2`, 첫 6개 성분 ×0.05. 이 model 전처리는 simulator controller goal scaling과 별도이며 원래 실험 그대로 유지한다.
- `EX8/scripts/build_bank.py`: train 35 demonstrations의 **전체 action transition**을 합쳐 `np.std(axis=0, ddof=0)` 계산. Validation/test action은 σ 계산에 포함하지 않는다.

한 curve에서는 한 좌표와 하나의 부호만 사용한다. 부호는 해당 action window에서 유효 범위의 여유가 큰 쪽으로, flow를 보기 전에 선택한다. Window 시작은 timestep 0, 길이는 1/4/8/20이다. 서로 다른 길이에서는 유효 여유가 달라 부호도 달라질 수 있으므로 저장된 sign을 함께 읽어야 한다.

기본 ε는 0/.01/.02/.05/.10/.20/.30/.50. 유효한 1/2/4σ를 추가하고, 배경 차이를 포함하지 못한 curve만 ε를 두 배씩 늘려 action 경계까지 추가 측정한다. 입력을 clipping해서 다른 perturbation으로 바꾸지 않는다. ε=0은 bitwise 검증된 BG0 reference를 재사용한다.

Primary EAP는 기존 normalized robot-flow difference의 측정 곡선에서 가장 작은 ε의 piecewise-linear 교차점이다. Isotonic 적합은 보조 비교로 저장한다. 비단조 반응을 강제로 단조로 만들지 않는다. 비단조성 횟수와 isotonic 보정량을 함께 제공한다. Curve의 최대 normalized response ≤1e-6이면 수치적으로 미약한 반응으로 표시한다. 측정 범위를 넘으면 EAP 숫자를 외삽하지 않고 `> max_tested`를 기록한다.

σ 단위는 선택 좌표·부호·길이에 의존한다. Controller의 goal increment와 실제 실현된 end-effector 이동은 같지 않으므로 cm/degree의 실현 오차로 환산하지 않는다. 같은 flow 변화 크기는 같은 flow 방향이나 같은 최종 궤적을 뜻하지 않는다.

Dose response에서도 원래 action A의 canonical GT robot mask를 고정한다. A_delta의 새로운 mask로 영역을 바꾸지 않으므로, EAP는 동일한 로봇 관련 latent 영역에서의 조건 민감도 보정이다.

범위를 확장한 큰 ε는 controller의 유효 입력 범위 안에 있어도 demonstration에서 흔한 action 크기라는 뜻은 아니다. EAP가 여러 σ이면 작은 perturbation으로 부르지 않는다.
