# Whole MaleCNS runtime — model card

## Identity and coverage

Dataset: `male-cns:v1.0`; selection: every official annotation with `status == Traced`. Runtime: `malecns-lif-v1`. This selection contains 165,122 neurons, 25,563,197 positive neuron-pair connection rows and 124,025,046 synapses. All nodes/edges in that selection are present. It does not contain all untraced/fragmentary segments, glia or every physiological mechanism.

The generated manifest at `assets/neural/manifest.json` records immutable original Google Storage generations, SHA-256 hashes, sizes, all source/exclusion counts, neurotransmitter handling, population identities and compressed/decoded asset hashes. The complete processing specification is `scripts/prepare-neural.py`. Data are CC BY 4.0; attribution: FlyEM/HHMI Janelia, University of Cambridge, MRC LMB and Google Research; Berg et al. Cell 2026, doi:10.1016/j.cell.2026.08.015. No synthetic graph is used as a fallback.

## Dynamics

Every neuron has membrane deviation v from -52 mV, synaptic current g, refractory state, spike counter and lesion flag. The threshold is v>7 mV above rest. Subthreshold equations are `dv/dt=(-v+g)/20 ms` and `dg/dt=-g/5 ms`. Their linear update is analytic over one step. Spiking resets v/g to zero and schedules a fixed refractory period. Synaptic arrivals add `0.275 mV * integer_synapse_count * presynaptic_sign` to g.

Step order: deliver due presynaptic spikes through original CSR rows; inject synthetic Poisson sensory impulses; update non-refractory membrane/current; detect spikes/reset; queue emitted spikes after the effective delay. Current and voltage integration pause during refractory steps; arriving current is retained. Sensory-driven cells have the same refractory rule here, unlike the special zero-refractory Poisson targets in the authors' reference code. This is explicitly NOT asserted equivalent to the published Brian2 implementation.

Default dt=0.5 ms gives effective delay=2 ms and refractory=2.5 ms from nominal 1.8/2.2 ms. Smaller selectable steps are experiments, not biological calibration. All parameters are inspired by the Shiu et al. point-neuron framework, not measured for each male neuron: https://doi.org/10.1038/s41586-024-07763-9 ; https://github.com/philshiu/Drosophila_brain_model/blob/main/model.py . The code is independently implemented.

Sparse execution skips only never-activated resting neurons, with full arrays/graph allocated. Once activated, a neuron remains in the integration set. Dense/sparse fixture agreement is tested. Spikes are not dropped to meet a graphics target. Quiescent initial state has no invented spontaneous background firing. This is not a claim that living brains are silent.

## Neurotransmitter approximation

Consensus acetylcholine is excitatory; GABA, glutamate and histamine inhibitory. Unknown/unclear and dopamine/octopamine/serotonin have zero outgoing efficacy. All affected graph rows remain stored. 4,143 neurons and 1,023,493 connections are affected. This does not model receptor-specific effects, neuromodulation, plasticity or peripheral muscle activation. It is not acceptable to claim all synapses have fully reconstructed function.

## Sensory/body coupling

The encoder receives delayed angular size/expansion and bearing, then drives identified LC4 and LPLC2 populations through assumed Poisson rates. It is not a photoreceptor/compound-eye reconstruction. Source soma side alone is not a measured receptive field; side-dependent input gain is a hypothesis. Sampling is around 5 ms with 25 ms delay, quantised by the selected step.

The graph propagates signals to real descending/wing-motor-labelled populations. A documented engineered readout uses their rates to propose a body-relative movement command; it does not receive stimulus geometry. DNp01, DNg02 and wing-motor-labelled populations contribute. Their motion gains and meanings are not inferred solely from wiring and are not a trained natural flight decoder. The broad wing-motor label is not a complete muscle-resolved mapping.

The existing reduced-order wing body converts commands to force-integrated movement using an engineered stabiliser. Heading alignment is disabled for neural backward commands so the controller does not continuously rotate to face its own backward vector. Stabiliser, readout, vision, named populations, synaptic transmission and wing actuation are independently switchable. This is a genuine graph/body loop with explicit hybrid assistance, NOT a completed physiological fly emulator.

No hand-coded angular-size threshold directly initiates an escape command in this adapter. Removing graph transmission must leave sensory spikes possible but eliminate downstream graph-mediated output. Removing motor readout must leave neural activity possible while removing its motor contribution. Those are causal implementation checks, not proof of biologically correct escape direction or timing.

## Laboratory and training

`neural.html` loads the full graph only after a user action. The anatomical X/Z soma projection is drawn from actual source coordinates; flashes come from computed spikes. Missing soma positions affect drawing only. Source graph download is 80,194,325 bytes, decoded graph 208,468,524 bytes. Memory can be substantially higher during decompression or with multiple workers; desktop recommended. CPU performance depends strongly on neural activity.

`?insect=neural` selects this opponent in the independent drone trainer. An immutable graph is shared within each worker, with fresh neuron/body/RNG states each episode. Training and simulation may occupy separate graph copies. The drone remains a separate 19/24/7 residual DQN. Full-neural initial evaluation uses two held-out seeds per controller; the actual denominator and data hash must accompany comparisons. The fly graph is not trained by the drone optimiser.

## Evidence and exports

`tests/neural.test.mjs`: strict binary validation, quiet initial state, delayed propagation, signs, lesions, transmission control, dense/sparse fixture agreement, timing and absence of surrogate fallback.

`scripts/neural-benchmark.mjs`: original-source/derived hashes and full census, six 200 ms closed-loop conditions (left/right, vision off, DNp01 off, readout off, transmission off). Results include actual spike counts, output counts, positions, commands and wall time. Full-data tests must not be silently skipped in a claimed neural release.

Experiment export stores the source manifest, nominal/effective model settings, body/configuration, events, body/neural traces, per-neuron aggregate spike counts, and a bounded 20,000-spike tail with a dropped-entry count. A spike tail is not a complete spike log. CI compact records are in `test-history`; detailed browser traces/screenshots have 90-day retention.

## Remaining acceptance gates

Missing: experimental flight/escape calibration; learned/receptor-aware neural motor decoding; complete visual/haltere/muscle pathways; spontaneous state/neuromodulation/plasticity; full articulated flybody and its validated trained policy; mosquito-specific transfer; realistic drone perception/dynamics; solved household safety. A full graph and a closed causal loop do not close these gates. Keep issue #3 open for physiological/upstream-body integration and empirical validation, and issue #2 open for known navigation failures.
