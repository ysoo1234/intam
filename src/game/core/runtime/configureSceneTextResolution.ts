import Phaser from "phaser";

type SceneTextResolutionSubscription = Readonly<{
  onAddedToScene: (gameObject: Phaser.GameObjects.GameObject) => void;
  onShutdown: () => void;
}>;

const subscriptions = new WeakMap<
  Phaser.Scene,
  SceneTextResolutionSubscription
>();

/**
 * Keeps Canvas-backed Phaser Text crisp when the logical scene is rendered
 * through a zoomed, high-resolution backing buffer.
 *
 * Phaser 4.2 normalizes an omitted TextStyle resolution from 0 to 1 before a
 * Text enters the display list. We upgrade only that normalized default. Any
 * non-default resolution already chosen by a feature remains untouched, and a
 * chained `setResolution` call still takes precedence after creation.
 */
export function configureSceneTextResolution(
  scene: Phaser.Scene,
  renderScale: number,
) {
  detachSubscription(scene);

  if (!Number.isFinite(renderScale) || renderScale <= 1) {
    return;
  }

  const onAddedToScene = (gameObject: Phaser.GameObjects.GameObject) => {
    if (
      gameObject instanceof Phaser.GameObjects.Text &&
      gameObject.style.resolution === 1
    ) {
      gameObject.setResolution(renderScale);
    }
  };

  const subscription: SceneTextResolutionSubscription = {
    onAddedToScene,
    onShutdown: () => detachSubscription(scene, subscription),
  };

  subscriptions.set(scene, subscription);
  scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, onAddedToScene);
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, subscription.onShutdown);
}

function detachSubscription(
  scene: Phaser.Scene,
  expected?: SceneTextResolutionSubscription,
) {
  const subscription = subscriptions.get(scene);

  if (!subscription || (expected && subscription !== expected)) {
    return;
  }

  scene.events.off(
    Phaser.Scenes.Events.ADDED_TO_SCENE,
    subscription.onAddedToScene,
  );
  scene.events.off(Phaser.Scenes.Events.SHUTDOWN, subscription.onShutdown);
  subscriptions.delete(scene);
}
