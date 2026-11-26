# Hawkes Process for Detecting Agentic Offensive Framework Activity

## Overview

A Hawkes process is a self-exciting point process in which each event temporarily increases the intensity (rate) of future events before that elevation decays toward a baseline. This property makes it suitable for detecting the characteristic burst-and-pause patterns produced by agentic offensive frameworks (e.g., ARTEX, CAIRN, PentAGI, CyberStrikeAI), which generate rapid sequences of tool invocations, probes, and related telemetry.

The core model is:

\[
\lambda(t) = \mu + \sum_{t_i < t} \phi(t - t_i)
\]

where \(\mu\) is the baseline intensity and \(\phi\) is a decaying excitation kernel (commonly exponential). The instantaneous jumps correspond to Dirac-delta-like impulses in the intensity dynamics.

This is the same mathematical approach already studied for clustered cyberattacks, DDoS bursts, and related phenomena. Application to agentic activity is a targeted extension that uses appropriate event streams and optional marked or multivariate enrichments rather than a fundamentally new process.

## Simple Explanation for Leadership

Autonomous offensive frameworks now enable multi-stage intrusions at machine speed, chaining reconnaissance, tool use, and adaptation in rapid bursts rather than at human pace. Traditional alerts treat events in isolation or rely on simple volume thresholds, so these clusters often appear as noise or contribute to alert fatigue.

A Hawkes process explicitly detects when one event temporarily raises the likelihood of subsequent related events before the boost fades. In practice it flags periods in which activity on a host, identity, or network becomes self-reinforcing—the signature of an agentic framework operating. The result is earlier identification of high-velocity autonomous activity, fewer low-value alerts (by elevating true causal clusters), and faster prioritization into SOAR workflows. The approach remains interpretable: baseline rate versus temporary excitation, and the timescale of decay.

## Operational Use

- Model relevant event streams (process creations, network probes, API calls, alert firings, file changes) associated with a host, identity, or segment.
- Elevated residual intensity or a high branching ratio indicates self-exciting activity.
- Multivariate versions capture mutual excitation across event types (e.g., reconnaissance elevating exploitation activity).
- Marked versions weight jumps by severity, tool category, or other attributes.
- The detector complements signature- or graph-based multi-stage correlation and can feed prioritized clusters into SOAR enrichment.

## Enriching with Existing Telemetry

The existing telemetry depth (ontology, network topology, blast-radius mapping, recent file changes, and cross-references across SentinelOne, Wiz, Axonius, and ArmorCode) can be incorporated without changing the core model:

- **Asset and blast-radius context**: Use criticality or blast-radius scores as marks or covariates that modulate excitation strength or prioritization.
- **Endpoint and process telemetry (SentinelOne)**: Treat process-creation or behavioral events as a primary or parallel stream; incorporate process-tree relationships as marks.
- **Vulnerability and exposure context (Wiz, ArmorCode)**: Model recent high-severity findings or exposures as external excitation or amplifying marks.
- **Identity and asset inventory (Axonius)**: Treat privileged or non-human identities as a distinct multivariate dimension; use recent configuration drift as a covariate.
- **Ontology-driven event typing / ATT&CK staging**: Enable a multivariate process in which specific stages or techniques excite one another more strongly.
- **Network topology**: Apply graph- or distance-based decay so lateral movement produces stronger mutual excitation between neighboring nodes.
- **Recent file and configuration changes**: Run a dedicated point process or mark for dense local artifacts typical of agentic frameworks.

These are standard marked, multivariate, or covariate extensions. The practical task is selecting a small number of high-signal streams and marks rather than ingesting all available data.

## Summary

The Hawkes process provides an interpretable, self-excitation-aware detector for the temporal signatures of agentic offensive frameworks. It builds on techniques already applied to clustered cyber events and can be enriched with the organization’s existing ontology, topology, and cross-tool telemetry to improve precision and business-context weighting.
