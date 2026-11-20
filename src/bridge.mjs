// Additive render layer only. Nothing reads a game object or publishes a global.
export function createBridge(factories) {
  const scenes = new WeakMap();
  const names = ['skyline', 'activity'];
  const poseFields = ['time','pace','lookYaw','lookPitch','crouch','turn','backpedal','strafe'];
  function finite(...v) { return v.every(Number.isFinite); }
  function mount(scene, native, makeActor, poseActor) {
    if (scenes.has(scene)) return;
    const entries = [];
    // Register before constructing anything so even a reentrant scene event can't mount twice.
    scenes.set(scene, entries);
    const THREE = Object.freeze(native);
    for (const [i, createArt] of factories.entries()) {
      const name = names[i];
      const ownActors = new WeakSet();
      const actors = Object.freeze({
        create(variant) {
          if (name !== 'activity') throw Error('This layer has no actor permission');
          if (!Number.isInteger(variant) || variant < 1 || variant > 9) {
            throw Error('Ambient actor variant must be an integer from 1 to 9');
          }
          const actor = makeActor(variant);
          if (actor.parent) throw Error('Ambient actor must be detached');
          ownActors.add(actor);
          return actor;
        },
        pose(actor, phase, gait, action = {}) {
          if (!ownActors.has(actor)) throw Error('Not an actor created by this layer');
          if (!finite(phase, gait) || !action || typeof action !== 'object') {
            throw Error('Bad ambient pose values');
          }
          const pose = {};
          for (const key of poseFields) {
            if (!Object.hasOwn(action, key)) continue;
            if (key === 'backpedal' && typeof action[key] === 'boolean') {
              pose[key] = action[key];
            } else {
              if (!finite(action[key])) throw Error('Invalid ambient pose field: ' + key);
              pose[key] = action[key];
            }
          }
          poseActor(actor, phase, Math.max(0, Math.min(1.4, gait)), pose);
        }
      });
      try {
        const spec = createArt(Object.freeze({THREE, actors}));
        if (!(spec?.root instanceof THREE.Group) || spec.root.parent ||
            (spec.update != null && typeof spec.update !== 'function')) {
          throw Error('Expected {root: detached Group, update?: function}');
        }
        const layer = new THREE.Group();
        layer.name = 'VICE COAST R12 | ' + name;
        layer.add(spec.root);
        scene.add(layer);
        entries.push({layer, name, update: spec.update || null});
      } catch (error) {
        // Production safety: a malformed owned art layer must not stop original game boot.
        // Offline qualification rejects all such failures, so published builds cannot rely on this.
        console.error('R12 mount failed: ' + name, error);
      }
    }
  }
  function update(scene, elapsed, x, y, z) {
    if (!finite(elapsed, x, y, z)) return;
    const views = scenes.get(scene);
    if (!views?.length) return;
    const input = Object.freeze({elapsed, eye: Object.freeze({x,y,z})});
    for (const entry of views) {
      if (!entry.update) continue;
      try {
        entry.update(input);
      } catch (error) {
        entry.update = null;
        entry.layer.visible = false;
        console.error('R12 update failed: ' + entry.name, error);
      }
    }
  }
  return Object.freeze({mount, update});
}
