# Early robot-flow direction vs completed-rollout trajectory

Existing cached paired flow and validated CoTracker trajectories; no new inference.

**Finding:** Lower early CosSim is associated with larger BG0-relative generated trajectory drift: task-demeaned Spearman rho = −0.829 (95% task-bootstrap CI −0.955 to −0.568; n=270). All six within-task coefficients are negative (−0.897 to −0.370), with heterogeneous strength. This supports an association between early directional sensitivity and downstream trajectory inconsistency, but does not establish a causal path. In this paired background intervention, background identity can influence both outcomes, and tracker appearance sensitivity is an alternative explanation.

Fixed early progress <=1/3; available evaluations 0,4,8; robot agentview L1–L5. BG0 excluded. 270 task/seed/background units. Same current x_tau paired flow on BG0 reference path. Completed rollout first20 frames, fixed validated CoTracker hand queries. 1000 task-cluster bootstrap, six clusters. Correlation is not causal evidence; tracker appearance confounding remains.

| Scope | Target | n | Spearman rho (95% CI) | Pearson r (95% CI) |
|---|---|---:|---|---|
| pooled | nD_traj_BG | 270 | -0.7299 [-0.8570, -0.5146] | -0.9602 [-0.9713, -0.7080] |
| pooled | nADE_GT | 270 | -0.3889 [-0.7302, 0.0240] | -0.9465 [-0.9682, -0.2309] |
| task_demeaned | nD_traj_BG | 270 | -0.8289 [-0.9550, -0.5684] | -0.9413 [-0.9595, -0.7077] |
| task_demeaned | nADE_GT | 270 | -0.6117 [-0.9048, -0.2407] | -0.9298 [-0.9606, -0.3126] |
| Original | nD_traj_BG | 45 | -0.8971 | -0.9636 |
| Original | nADE_GT | 45 | -0.8991 | -0.9671 |
| T01 | nD_traj_BG | 45 | -0.6187 | -0.3326 |
| T01 | nADE_GT | 45 | -0.1704 | -0.0648 |
| T02 | nD_traj_BG | 45 | -0.7137 | -0.8656 |
| T02 | nADE_GT | 45 | -0.1754 | -0.6259 |
| T03 | nD_traj_BG | 45 | -0.8391 | -0.8097 |
| T03 | nADE_GT | 45 | -0.4530 | -0.5844 |
| T04 | nD_traj_BG | 45 | -0.3697 | -0.3839 |
| T04 | nADE_GT | 45 | -0.2574 | -0.3539 |
| T05 | nD_traj_BG | 45 | -0.8646 | -0.8890 |
| T05 | nADE_GT | 45 | -0.3141 | -0.2784 |

Cosine distance=1−CosSim reverses both correlation signs (and negates/reverses CI endpoints). Negative CosSim correlation means larger directional difference is associated with larger trajectory difference. This does not establish that early directional drift causes the final trajectory change. Task and background identity may affect both; the 2D tracker can also respond to appearance. Only six task clusters and the first20-action chunk are covered.
