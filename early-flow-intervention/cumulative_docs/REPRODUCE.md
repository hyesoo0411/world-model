# Reproduce

This experiment reuses EX10 loaders, masks, canonical input tensors, baseline trajectories and CoTracker code. EX10/EX8/EX9 raw results are read-only.

1. `scripts/run_full_spatial.py --smoke` generates one baseline/reference/no-op pair and E / E+M / M+L / All-steps interventions.
2. `scripts/track_full_spatial.py` tracks the pilot using the validated 21-frame pipeline.
3. `scripts/validate_smoke.py` checks exact flow assignments, hashes, baseline/no-op replay and the All-steps upper bound. Manually inspect `figures/smoke_montage.png`, then record review in `results/smoke_gate.json`. The full runner refuses to proceed without this gate.
4. Four disjoint `scripts/run_worker.py --worker <0..3> --workers 4` jobs generate and then track the benchmark. Completed cases are reused. Submit through `scripts/submit.py`, which checks queue occupancy and requires a memory rationale. If all four allowed RUNNING slots are occupied, the one-off deferred worker uses explicit Slurm dependencies rather than starting a fifth job.
5. Run `analyze_cumulative.py`, `validate_final.py`, `figures_cumulative.py`, `report_cumulative.py`, then `build_site.py` from `scripts/` with the DreamDojo virtualenv. `finalize_when_ready.py` does this after all1080 trajectories exist.
6. Review figures and videos, then `package_site.py` stages only static public artifacts. `check_site.py` validates the site in Playwright before and after publishing. No raw tensors or checkpoint are published.

Model Python: `workspace/DreamDojo/.venv/bin/python`. Set `MPLCONFIGDIR` to this experiment's `runtime/matplotlib`. The GPU job script records code snapshots, CPU RAM high-water mark and separate PyTorch GPU allocator peaks.

Executed configuration: `configs/protocol.json`. A readable version without inherited robot-only metadata is `docs/full_spatial_protocol.json`; its `executed_protocol_sha256` binds it to the exact execution file. Full-spatial semantics are defined by `space` and `windows`. Checkpoint commit, revision and existing default-cache paths are in `docs/model_provenance.json`.

During this run the external EX1 source checkout disappeared. The identical commit was recovered into `runtime/A2World`; all10 recorded source hashes matched. `source_recovery.py` redirects only this experiment's source lookups while retaining the existing hash checks. `validate_source_recovery.py` replays BG0/BGb/no-op/E+M/All-steps against saved tensors and RGB. `resume_balanced.py --worker <0..3>` resumes the remaining512 cases from `configs/resume_assignment.json`, preserves568 completed cases, and retains the original disjoint tracker partition after all generation finishes. No previous experiment source file is edited.
