# Output schema

All paths are relative to this experiment. Numerical flow values are latent-space velocity, not physical end-effector velocity.

| Requested output | Artifact |
|---|---|
| Background name, action ID/hash, seed, tau/sigma/progress | `results/<task>/seed<seed>/cases/<action_id>/<BG>/complete.json`, or `bank/<action_id>/<BG>/complete.json` |
| Actual shared sampler tensor and normalized future tensor | `reference/stepNN.pt`: `xt`, `z_t`; initial sampler tensor in `reference/initial_noise.pt` |
| Exact tensor hashes and pairing assertions | `complete.json` rows: `noise_hash`, `normalized_noise_hash`, action/model-action/BF16-action hashes, physical-state hash, equality flags |
| Checkpoint, scheduler, instruction, cameras, action preprocessing | `reference/paired_controls.json`; source hashes/revisions in `docs/` |
| Raw velocity | `stepNN.npz`: `flow_velocity`, shape `[1,16,12,32,32]` |
| Temporal robot mask and coverage | `robot_mask`, `robot_coverage`, shape `[12,32,32]`; primary excludes conditioning positions and wrist view |
| Masked velocity and primary probe representation | `robot_masked_flow`, `representation`; flattened `[12,16]` with temporal order intact |
| Alternate probe controls | `fixed_mask_representation`, `mask_only_representation` |
| Robot/full/background flow differences | Canonical `complete.json`; bank **`paired_background_metrics.json`**, paired with BG0 for the same action ID |
| Background difference heatmap | Canonical `stepNN.npz:flow_difference_heatmap`; bank **`paired_background_heatmaps.npz`** |
| Action perturbation and robot flow response | `cases/action_dJ_eE/BG0/complete.json`; one action time/dimension only, training-set std and actual delta recorded |
| Numerator, denominator, ratio and stability | `results/metrics.csv`, `results/metrics.json`, `results/action_control_sweep.json` |
| Probe predictions and targets | `probes/representation_<linear-or-mlp>_stepNN_BGK_predictions.npz`, indexed by `action_ids`; train/validation/canonical/control predictions have explicit suffixes |
| Probe R², ΔR² and paired predicted-action drift | `probes/metrics.json`, aggregate `results/probe_metrics.csv`; per-coordinate/time/dimension/group values in JSON |
| Probe uncertainty | `results/probe_bootstrap.json`: demonstration-cluster resampling, same resampled demos across backgrounds |
| Secondary clean estimate | `reference/stepNN.pt:x0_secondary` and canonical BG0/BG8 NPZ; official denoiser conversion only |
| Secondary decoded videos | `results/Original/seed0/decoded/{A,B,C}/`; actual per-chunk shared noise tensors alongside |

The initial bank capture's `D_all`, `D_background`, and `flow_difference_heatmap` compare to the **canonical-action** BG0 reference. They include action differences and are not background-only bank metrics. Use the separate `paired_background_*` files for same-action background comparisons. Raw flow tensors remain unchanged.

R² is a test-set statistic and is undefined for an individual inference case. Prediction NPZs join to bank cases by `action_ids`; `metrics.json` joins by task, probe, representation, background, and step. Action-control ratios are evaluated on the canonical action sequence, not every bank action. Unrun combinations are not assigned invented values.

`finalization_status.json` is marked completed only after every task's probes, strict paired validation, figures/report, and browser checks finish. `validation.json` explicitly lists any missing required artifacts.
