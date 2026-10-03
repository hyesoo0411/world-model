# 기존 실험 확인 — 사용자 선택: settled_v2

새 작업 위치: `experiments/[EX8]_flow_velocity_analysis`.
재사용 대상은 `[EX2]_background_action_invariance/results/a2world_2b/settled_v2`다. 최초 실험과 혼합하지 않는다. 원본은 `[EX2]_background_action_invariance`로 이름만 변경했다. 이전 이름은 호환 링크다. 기존 결과 내용은 수정하지 않는다.

| Task | Suite / task | Demo | Canonical physical state hash |
|---|---|---|---|
| Original | libero_10 / STUDY_SCENE1_pick_up_the_book_and_place_it_in_the_back_compartment_of_the_caddy | demo_47 [0:40] | `0ea882672f492d84780f4b57128af453fe129efd52f72b15ce35490ca6da1069` |
| T01 | libero_90 / STUDY_SCENE2_pick_up_the_book_and_place_it_in_the_back_compartment_of_the_caddy | demo_6 [0:40] | `e6002891104fad0bc1da003092c8ac6f220b69362c6893d85ca0b2daacd49eb0` |
| T02 | libero_90 / STUDY_SCENE3_pick_up_the_white_mug_and_place_it_to_the_right_of_the_caddy | demo_44 [0:40] | `7ab07d05db9b206bf6e5c4cd74dc888e2e5b0f2404805a68a1f1bb0b5475f63c` |
| T03 | libero_90 / STUDY_SCENE4_pick_up_the_book_on_the_right_and_place_it_on_the_cabinet_shelf | demo_39 [0:40] | `e9055165efd2caa6818f693e09238dd2de35c656513a8428d0f740f0b7fc3ef7` |
| T04 | libero_10 / LIVING_ROOM_SCENE2_put_both_the_cream_cheese_box_and_the_butter_in_the_basket | demo_12 [0:40] | `c432f64e96352cbe9ffa5a4bcc29030572d22fcbe1e0d46822aab212141ecf2d` |
| T05 | libero_10 / LIVING_ROOM_SCENE6_put_the_white_mug_on_the_plate_and_put_the_chocolate_pudding_to_the_right_of_the_plate | demo_31 [0:40] | `9874c4ea5ce62ca341f4e1b913a4c40f40ea4bae2e726aa668c93711a160fa83` |

각 task의 `phase1/canonical_state` XML/integration/controller snapshot을 복원한다. 공식 initial-state index 0에서 zero-action settling 14 steps(T04:19) 후 저장한 상태다. Action 40 steps, 20 Hz; model은 20×2 chunks, 10 FPS. 카메라는 agentview(ID2)/robot0_eye_in_hand(ID0), inference RGB 256², preview 256²/512². Upright flip와 INTER_AREA resize, 최초 history 17장/view 반복을 유지한다. 35 denoising steps, guidance 0, seeds 0/1/2. Task text는 metadata에 보존하고 model은 zero embedding을 쓴다.

| ID / name | 정확한 texture 설정 (0–255) |
|---|---|
| BG0 ORIGINAL | 원래 LIBERO plaster |
| BG1 LIGHT_GRAY | (184,184,184) |
| BG2 PALE_BLUE | (174,188,198) |
| BG3 LOW_CONTRAST_CHECKER | (174,174,174)/(186,186,186), 8×8 cells/texture |
| BG4 LOW_CONTRAST_NOISE | gray 180±8, 32×32 integer grid, bilinear resize, seed 20260915 |
| BG5 SATURATED_BLUE | (25,70,190) |
| BG6 BURNT_ORANGE | (210,65,25) |
| BG7 FOREST_GREEN | (30,150,65) |
| BG8 HIGH_CONTRAST_CHECKER | (35,35,35)/(230,230,230), 4×4 cells/texture |
| BG9 HIGH_CONTRAST_NOISE | gray 128±100, 16×16 integer grid, bilinear resize, seed 20260915 |

| BG10 WARM_MATCHED_CHECKER | endpoints (168,123,75)/(217,167,117), 4×4 cells |
| BG11 WARM_MATCHED_NOISE | 같은 warm palette LUT; BG9 scalar field |
| BG12 COOL_MATCHED_CHECKER | endpoints (39,140,188)/(98,186,236), 4×4 cells |
| BG13 COOL_MATCHED_NOISE | 같은 cool palette LUT; BG9 scalar field |
| BG14 MATCHED_GRAY_MATCHED_CHECKER | endpoints (132,132,132)/(176,176,176), 4×4 cells |
| BG15 MATCHED_GRAY_MATCHED_NOISE | 같은 gray palette LUT; BG9 scalar field |

BG10–15의 정확한 이름/전체 256-entry RGB LUT와 모든 조건 parameters는 원본 `conditions.json`을 `configs/protocol.json`에 그대로 보존했다. LUT를 endpoints 사이 단순 RGB 보간으로 대체하지 않는다. `palette_revision=settled_v2_L55_72_C35`; 목표 L*=55–72, warm/cool C*=35, gray C*=0, hue 70°/250°. 기존 `create_background_variants.bitmap/apply_background`를 재사용한다.

원본 validation: `phase1_validation.json`, task별 `phase1/validation/state_equality.json`, `phase2/metadata/gt_validation.json`, `final_validation.json`. 모든 배경의 physical/fixed model 최대 오차 0, robot/non-wall 내부 RGB 오차 0. GT 40-frame 물체 drift 최대 1.92e-8 m, robot contact 0. 이 값은 기존 검증 결과이며 새 mask replay 검증은 별도로 저장한다.

기존 inference: 원본 최상위 `scripts/run_a2world_paired.py`, `BG_PILOT_ROOT`로 task 선택. Site: settled `visualization/index.html`, `method.html`, `tasks/<task>/visualization/index.html`. Outputs: `tasks/<task>/phase1/{canonical_state,initial_frames,metadata,validation}`와 `phase2/{actions,inputs,simulator_gt,a2world_rollouts,metadata}`, tracking `quantification/`, 집계 `metrics.csv`, `plots/`.

주 비교는 첫 20-action chunk에서 동일한 물리 상태/conditioning을 엄격히 통제한다. 전체 40-action 파일은 보존하고 2-chunk 자유 생성은 secondary rollout 진단으로 구분한다. 두 번째 chunk의 배경별 생성 history는 이미 달라질 수 있으므로 단독 배경 개입과 혼합하지 않는다.

파일 hashes: `source_hashes.json`. 생성 시각과 폴더 변경: `directory_renames.json`.
