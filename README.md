# World Model

A2World background perturbation sensitivity in LIBERO. Static publication snapshot of the existing settled_v2 flow-velocity experiment.

- [Interactive site](https://hyesoo0411.github.io/world-model/visualization/)
- [Shareable summary (no JavaScript required)](https://hyesoo0411.github.io/world-model/share.html)
- [Report](REPORT.md)
- [Normalized flow analysis](docs/normalized_flow.md)

The snapshot contains published figures, metrics, visualizations and secondary rollout videos. Model checkpoints, raw inference tensors and runtime files remain in the original experiment.

GitHub Pages publishes the `main` branch root; `.nojekyll` serves the static files directly. Any static host can serve the same directory. Local preview: `python -m http.server 8000`, then open `http://localhost:8000/`.

Results are descriptive measurements on a common BG0 latent path. They are not independent-rollout endpoint differences or proof of physical motion errors. See the report for scope and limitations.

The bundled Korean font retains its upstream license in `visualization/fonts/LICENSE.txt`.

## Flow → Trajectory extension

- [Sections 9–13](https://hyesoo0411.github.io/world-model/visualization/#flow-trajectory)
- [Trajectory, re-probing and action-calibration report](visualization/trajectory_extension/REPORT.md)
- [Joint metrics](visualization/trajectory_extension/results/joint_metrics.csv)

EX9 reuses the 288 generated rollouts, validated simulator projection and CoTracker trajectories. It tests flow–trajectory associations, within-background/leave-one-background-out action readouts, and equivalent action perturbations. The primary trajectory endpoint is a 2D hand-surface query centroid over the first 20-action chunk. Associations do not establish causal mediation.
