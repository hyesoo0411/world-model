# Flow drift → action realization

EX2 settled_v2의 6 tasks, BG0–BG15, seed 0–2를 그대로 사용한다. EX7의 별도 210-window x0/final-z probe는 EX8 flow probe와 표본·표현이 달라 수치를 혼합하지 않는다.

- GT 추출: EX2/scripts/phase2_simulator.py의 CanonicalScene.state/replay. 저장된 EE 위치·회전, gripper, joint, 모든 body pose를 재사용하고 16배경 사이 배열을 직접 비교한다.
- 투영: EX2/scripts/prepare_tracking_queries.py. segmentation으로 선정한 hand_visual 표면의 동일 query를 depth 역투영하고 body pose로 운반한 oracle_tracks를 재사용한다.
- 추적: EX2/scripts/track_robot_motion.py 및 EX7/scripts/track.py의 CoTracker3 scaled offline. 기존 궤적과 visibility >0.9를 재사용한다.
- 주 궤적: 고정된 손 표면 query 집합의 중심. frame 1–20, image diagonal 362.04 px로 정규화. 모든 query가 보이는 미래 frame 비율 95% 미만이면 ADE 제외. FDE는 마지막 frame 가시성 필수. 보간 없음.
- 캐시 tracker는 41-frame offline 입력이었다. 주 metric만 첫 20-action 구간으로 제한하며, tracker가 후속 frame 문맥을 이용했다는 한계를 기록한다.
- flow: EX8/scripts/normalized_flow.py compare 함수를 그대로 사용, epsilon 1e-8. BG0 경로의 저장된 실제 x_tau에서 조건 민감도를 측정한다. 독립 배경 rollout 경로의 flow와 다르다.
- 상관: BG1–BG15만 주 분석. pooled / task demeaned / task별 Spearman 및 Pearson. 1000회 task bootstrap; 6 task cluster의 한계. AUC는 denoising progress 적분이다.
- probe: EX8의 100 action windows/task, 35/7/8 demo split, 192D temporal masked flow, raw 140D action target, train-only standardization. BG0 test 캐시는 유지하고, 배경별 train/validation 표현만 추가한다. Linear ridge 및 192→128 ReLU→140 MLP를 같은 검증 규칙으로 비교한다.
- dose: x/y/z 및 rx/ry/rz, 시작 timestep 0, 길이 1/4/8/20. 한 curve에서 같은 부호를 사용하며 유효 여유가 큰 부호를 선택한다. 0–0.5 sigma 기본, 유효하면 1/2/4 sigma 추가. 범위가 부족한 curve만 action 경계까지 두 배씩 추가 측정한다. gripper는 이산적이라 제외한다. EAP는 정규화 flow response의 첫 piecewise-linear 교차점; 범위 밖은 하한으로만 표기한다.
- R²는 개별 rollout의 점수가 아닌 seed0 action-bank test cohort 점수이다. 합친 테이블에는 이 수준과 평가 seed를 명시하며 seed1/2에 독립적인 R² 관측값처럼 복제하지 않는다.

Action bank의 다른 demo window도 기존 EX8처럼 task별 동일 canonical 초기 관측에서 조건으로 사용한다. Mask는 그 canonical simulator state에서 해당 action window를 replay한 시간별 GT mask이다. 원래 demo의 관측 프레임을 조건으로 섞지 않는다.
