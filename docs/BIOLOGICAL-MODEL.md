# Physical fly model and its controller modes

This page describes the shared reduced-order mechanics used by the browser laboratory. The full original v0.2 equations, parameter provenance and historical packaging notes remain preserved in [archive/BIOLOGICAL-MODEL-v0.2.md](archive/BIOLOGICAL-MODEL-v0.2.md). The authoritative current project specification is [EXECUTION-BRIEF.md](EXECUTION-BRIEF.md), especially sections 9–11 and 18. Neural dynamics are documented separately in [NEURAL-MODEL.md](NEURAL-MODEL.md).

## Mechanics versus controller

`biology.html` remains the engineered sensory/wing-control comparison. `neural.html` runs the entire selected MaleCNS graph and reads actual downstream neural activity into a declared motor adapter and the same physical body. The mechanical model is not a neural connectome; the full graph does not make its simplified aerodynamics an empirically validated fly.

The current body integrates translation and rotation from approximate aerodynamic wing forces, gravity, drag and inertia. The controller changes wing kinematics rather than setting position or velocity. Two wings with four radial elements each use a semi-elliptical planform and quasi-steady translational lift/drag. No constant supporting force is inserted when wing actuation is disabled.

Reference values: mass 0.983 mg, length 2.97 mm, span 6.04 mm, wingbeat 218 Hz. Wing area 2.2 mm² per wing and hinge-to-tip length 2.5 mm are assumptions. Inertia uses a solid-ellipsoid approximation. The assumed coefficient curves are CL=1.8 sin(2 alpha), CD=0.12+2.5 sin²(alpha). Source reference: Vaxenburg et al., Nature 2025, doi:10.1038/s41586-025-09029-4. These selected dimensions do not make this code a port of the authors' complete model.

Coordinates: right-handed Y-up world; body X right/Y dorsal/Z forward; [w,x,y,z] body-to-world quaternions. SI units. Default body substep limit 0.2 ms, with smaller subdivisions when required by the caller. Hover trim solves cycle-average lift against reference weight. The engineered stabilizer uses filtered angular feedback and desired velocity, with assumed gains and a 2 ms motor filter.

For neural mode, `alignHeading` is explicitly false: a backward body-relative neural command must not continually turn the fly to face its own backward vector. The earlier local diagnostic with heading alignment enabled produced the wrong movement direction despite neural propagation; that engineering correction is retained in the claim/evidence record. It is not a biological finding.

## Limits and verification

Not modeled: full articulated upstream flybody, wing flexibility/inertia, unsteady vortex history, added-mass and rotational lift, full muscles, physiological halteres, empirical sensory/motor calibration or mosquito-specific flight. Neural mode still uses an engineered motor decoder and stabilizer; these are separately switchable and not hidden as reconstructed physiology.

Existing tests cover units, force/torque symmetry and signs, beat-varying force, hover, wings-off descent, lateral movement, timestep sensitivity, perturbations and seeded replay. Neural tests add propagation, delay, signs, lesions, disconnection and full-data causal experiments. Per-commit Actions records establish actual test outcomes. Passing software tests is not empirical aerodynamic or household-safety validation.

Historical note: the archived v0.2 text says publication was unavailable at packaging. That describes the earlier local package only. v0.2 was subsequently published in commit b3491613 after 51 Node and seven Chromium tests; current release/publication status is established by the latest Actions run and `build.json`, not the archived packaging paragraph.
