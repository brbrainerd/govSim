//! Deterministic RNG with a split-tree derivation. The root seed is part of
//! every scenario; per-system RNGs are derived by HKDF-style domain
//! separation so parallel systems remain reproducible (blueprint §3.4).

use bevy_ecs::prelude::Resource;
use rand::SeedableRng;
use rand_chacha::ChaCha20Rng;

#[derive(Resource, Clone)]
pub struct SimRng {
    root_seed: [u8; 32],
}

impl SimRng {
    pub fn new(root_seed: [u8; 32]) -> Self {
        Self { root_seed }
    }

    pub fn root_seed(&self) -> [u8; 32] { self.root_seed }

    /// Derive a child RNG keyed by a label and an integer salt.
    /// The derivation is deterministic and machine-independent.
    pub fn derive(&self, label: &str, salt: u64) -> ChaCha20Rng {
        // Blake3 keyed hash → ChaCha20 seed. We don't pull blake3 here to
        // keep deps light; do a simple FNV-1a mix for now and upgrade in
        // simulator-snapshot where blake3 is already a dep.
        let mut seed = self.root_seed;
        let mut h: u64 = 0xcbf29ce484222325;
        for b in label.as_bytes() {
            h ^= *b as u64;
            h = h.wrapping_mul(0x100000001b3);
        }
        h ^= salt;
        for (i, byte) in h.to_le_bytes().iter().enumerate() {
            seed[i] ^= byte;
        }
        ChaCha20Rng::from_seed(seed)
    }

    /// Derive a per-citizen RNG keyed by label, tick, and citizen id.
    /// Outcomes are a pure function of (root_seed, label, tick, citizen_id),
    /// independent of ECS entity iteration order — required for replay determinism
    /// after birth/death changes the entity table layout.
    pub fn derive_citizen(&self, label: &str, tick: u64, citizen_id: u64) -> ChaCha20Rng {
        let mut seed = self.root_seed;
        let mut h: u64 = 0xcbf29ce484222325;
        for b in label.as_bytes() {
            h ^= *b as u64;
            h = h.wrapping_mul(0x100000001b3);
        }
        h ^= tick.wrapping_mul(0x9e3779b97f4a7c15);
        h = h.wrapping_mul(0x100000001b3);
        h ^= citizen_id.wrapping_mul(0x6c62272e07bb0142);
        h = h.wrapping_mul(0x100000001b3);
        for (i, byte) in h.to_le_bytes().iter().enumerate() {
            seed[i] ^= byte;
        }
        ChaCha20Rng::from_seed(seed)
    }
}
