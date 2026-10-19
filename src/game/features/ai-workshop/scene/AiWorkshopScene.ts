import Phaser from "phaser";
import { fadeOutOfPlace, startSceneTravel } from "../../../core/visual/sceneTravel";
import { GAME_ASSETS } from "../../../assets";
import type { ControlKeys } from "../../../core/input/controlKeys";
import type { PlayerFacing } from "../../../core/player/playerFacing";
import { preloadPlayerTextures } from "../../../core/player/playerSprite";
import { createWorldReturnSceneData } from "../../../core/navigation";
import { recordActivityStars } from "../../../core/navigation/worldProgressStorage";
import { markTutorialSeen, shouldPlayTutorial } from "../../../core/navigation/tutorialProgressStorage";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { generateCustomerTexture, generatePlayerTexture } from "../../../core/visual/fallbackTextures";
import { preloadGameChromeAssets } from "../../../core/visual/gameChrome";
import { preloadGameResultOverlayAssets } from "../../../core/visual/gameResultOverlay";
import { createGameStartOverlay, isGameStartOverlayOpen, preloadGameStartOverlayAssets } from "../../../core/visual/gameStartOverlay";
import { AI_WORKSHOP_START } from "./workshopStart";
import { isCoachCardOpen, playCoachCountdown, preloadCoachAssets } from "../../../core/visual/coachGuide";
import { createWorkshopTutorial, type WorkshopTutorial } from "./workshopTutorial";
import { COLORS } from "../../../core/visual/theme";
import { WORKSHOP_PRODUCT_BY_ID, WORKSHOP_REQUESTS, type WorkshopProduct, type WorkshopRequest } from "../../../content/aiWorkshop";
import {
  AI_WORKSHOP_CONFIG,
  createWorkshopOrder,
  getWorkshopReward,
  getWorkshopStars,
  isWorkshopDeliveryCorrect,
  type WorkshopOrder,
  type WorkshopPhase,
} from "../model";
import { AI_WORKSHOP_LAYOUT } from "./layout";
import { startWorkshopDialogue } from "./workshopDialogue";
import { createWorkshopControls, type WorkshopControls } from "./workshopControls";
import { applyWorkshopCustomerRequestVisual, WORKSHOP_CUSTOMER_HEAD_TOP_KEY } from "./workshopCustomerVisual";
import { animateWorkshopCustomerArtworkJoy, createCustomerJoyEffect, createWorkshopCoinBurst, createWorkshopSparkBurst } from "./workshopEffects";
import {
  preloadWorkshopSceneAssets,
  unloadWorkshopSceneAssets,
} from "./workshopAssets";
import { createWorkshopItemPanel, createWorkshopProductChoices, hideWorkshopItemPanel, rebuildWorkshopCarriedVisuals, returnWorkshopProductToPanel, showWorkshopItemPanel, type WorkshopProductChoice, type WorkshopProductOrigin } from "./workshopProducts";
import { updateWorkshopPlayer, updateWorkshopPlayerPerspective } from "./workshopPlayer";
import { createWorkshopResultOverlay } from "./workshopResult";
import { WorkshopStarCatch } from "./workshopStarCatch";
import {
  findNearestWorkshopProduct, findNearestWorkshopProductOrigin, isWorkshopPlayerAtCustomer,
  isWorkshopPlayerAtWorkbench, renderWorkshopHud, vibrateDevice,
} from "./workshopStatus";
import { createWorkshopTapTargets, type WorkshopTapTargets } from "./workshopTapTargets";
import { playWorkshopProductReveal } from "./workshopProductReveal";
import { playWorkshopSound } from "./workshopSounds";
import { createWorkshopBackground, createWorkshopCustomer, createWorkshopHud, createWorkshopPlayer, setWorkshopCustomerRole, syncWorkshopDialoguePanel } from "./workshopView";
export class AiWorkshopScene extends Phaser.Scene {
  private keys?: ControlKeys;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private player?: Phaser.GameObjects.Container;
  private playerSprite?: Phaser.GameObjects.Image;
  private playerFacing: PlayerFacing = "front";
  private customerContainer?: Phaser.GameObjects.Container;
  private customerShadow?: Phaser.GameObjects.Ellipse;
  private customerArt?: Phaser.GameObjects.Image;
  private customerEmoji?: Phaser.GameObjects.Text;
  private customerRoleText?: Phaser.GameObjects.Text;
  private dialoguePanel?: Phaser.GameObjects.Graphics;
  private dialogueText?: Phaser.GameObjects.Text;
  private typingTimer?: Phaser.Time.TimerEvent;
  private hangingProducts: WorkshopProductChoice[] = [];
  private itemPanel?: Phaser.GameObjects.Image;
  private carriedProducts: WorkshopProduct[] = [];
  private carriedOrigins: WorkshopProductOrigin[] = [];
  private carriedVisuals: Phaser.GameObjects.Container[] = [];
  private currentOrder?: WorkshopOrder;
  private requestDeck: WorkshopRequest[] = [];
  private sessionRequests: WorkshopRequest[] = [];
  private phase: WorkshopPhase = "request";
  private customerNumber = 0;
  private completedCustomers = 0;
  private coins = 0;
  private wrongDeliveries = 0;
  private remainingMs: number = AI_WORKSHOP_CONFIG.gameDurationMs;
  private timerText?: Phaser.GameObjects.Text;
  private coinText?: Phaser.GameObjects.Text;
  private mistakeText?: Phaser.GameObjects.Text;
  private customerCountText?: Phaser.GameObjects.Text;
  private promptText?: Phaser.GameObjects.Text;
  /** Touch is the main control: tap a thing, Midi walks there and uses it. */
  private controls?: WorkshopControls;
  private tapTargets?: WorkshopTapTargets;
  private workbenchGlow?: Phaser.GameObjects.Rectangle;
  private workbenchSprite?: Phaser.GameObjects.Image;
  private joystick = new Phaser.Math.Vector2();
  private updateTouchDirection?: () => void;
  private actionQueued = false;
  private starCatch?: WorkshopStarCatch;
  private finished = false;
  private earnedStars?: 0 | 1 | 2 | 3;
  /** Set while the first customer is taught step by step (first play only). */
  private tutorial?: WorkshopTutorial;
  /** The clock runs only in the real game, not during the tutorial or countdown. */
  private timerRunning = false;

  constructor(private readonly renderScale: number) {
    super(SCENE_KEYS.aiWorkshop);
  }

  preload() {
    preloadGameChromeAssets(this);
    preloadGameResultOverlayAssets(this);
    preloadGameStartOverlayAssets(this);
    preloadWorkshopSceneAssets(this);
    Object.entries(GAME_ASSETS.shop.products).forEach(([productId, asset]) => {
      this.load.image(`workshop-product-${productId}`, asset);
    });
    Object.entries(GAME_ASSETS.shop.blueprints).forEach(([productId, asset]) => {
      this.load.image(`workshop-blueprint-${productId}`, asset);
    });
    this.sessionRequests = Phaser.Utils.Array.Shuffle([
      ...WORKSHOP_REQUESTS,
    ]).slice(0, AI_WORKSHOP_CONFIG.sessionRequestLimit);
    this.sessionRequests.forEach((request) => {
      this.load.image(
        `workshop-customer-${request.id}-worried`,
        request.customerImage,
      );
      this.load.image(
        `workshop-customer-${request.id}-happy`,
        request.customerHappyImage,
      );
    });
    preloadPlayerTextures(this);
    preloadCoachAssets(this);
    // A loading card instead of an empty canvas while the pictures load.
    startSceneTravel(this, this.renderScale);
  }

  create() {
    configureSceneCamera(this, this.renderScale);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unloadWorkshopSceneAssets(this);
      [
        ...Object.keys(GAME_ASSETS.shop.products).map(
          (productId) => `workshop-product-${productId}`,
        ),
        ...Object.keys(GAME_ASSETS.shop.blueprints).map(
          (productId) => `workshop-blueprint-${productId}`,
        ),
      ].forEach((key) => this.textures.remove(key));
      this.sessionRequests.forEach((request) => {
        this.textures.remove(`workshop-customer-${request.id}-worried`);
        this.textures.remove(`workshop-customer-${request.id}-happy`);
      });
    });
    generatePlayerTexture(this);
    generateCustomerTexture(this);
    this.starCatch = new WorkshopStarCatch(this, (text) => this.promptText?.setText(text));
    this.resetState();
    ({ workbenchGlow: this.workbenchGlow, workbenchSprite: this.workbenchSprite } =
      createWorkshopBackground(this));
    this.itemPanel = createWorkshopItemPanel(this);
    ({
      timerText: this.timerText,
      coinText: this.coinText,
      mistakeText: this.mistakeText,
      customerCountText: this.customerCountText,
      dialoguePanel: this.dialoguePanel,
      dialogueText: this.dialogueText,
      promptText: this.promptText,
    } = createWorkshopHud(this, {
      onRestart: () => this.scene.restart(),
      onWorld: () => this.returnToWorld(),
      canPause: () => !this.finished,
    }));
    ({
      customerContainer: this.customerContainer,
      customerShadow: this.customerShadow,
      customerArt: this.customerArt,
      customerEmoji: this.customerEmoji,
      customerRoleText: this.customerRoleText,
    } = createWorkshopCustomer(this));
    ({
      player: this.player,
      playerSprite: this.playerSprite,
    } = createWorkshopPlayer(this));
    updateWorkshopPlayerPerspective(this.player, this.carriedVisuals);
    this.controls = createWorkshopControls(this, () => this.player);
    ({
      keys: this.keys,
      cursors: this.cursors,
      joystick: this.joystick,
      updateTouchDirection: this.updateTouchDirection,
    } = this.controls);
    this.tapTargets = createWorkshopTapTargets(this, this.customerContainer, {
      controls: this.controls,
      getPhase: () => this.phase,
      getPlayer: () => this.player,
      getHanging: () => this.hangingProducts,
      getCarriedOrigins: () => this.carriedOrigins,
      getCarriedVisuals: () => this.carriedVisuals,
      hasCarried: () => this.carriedProducts.length > 0,
      isFinished: () => this.finished,
      pickProduct: (choice) => this.pickProduct(choice),
      returnCarried: (index) => this.returnCarriedProduct(index),
      useWorkbench: () => this.useWorkbench(),
      needProductsFirst: () => this.promptText?.setText("먼저 상품을 골라서 가져와 주세요"),
      deliver: () => this.completeCustomer(),
    });
    createGameStartOverlay(this, AI_WORKSHOP_START, (withTutorial) => this.handleStart(withTutorial), {
      help: { question: "튜토리얼을 다시 볼까요?" },
    });
  }

  /**
   * `withTutorial` is set by the ? button; otherwise first plays get the
   * tutorial. A tutorial watched again from ? ends back on the start screen;
   * the first-play tutorial goes straight on into the game.
   */
  private handleStart(withTutorial?: boolean) {
    const replaying = withTutorial === true;
    const playTutorial = withTutorial ?? shouldPlayTutorial("ai-workshop");
    if (!playTutorial) {
      playCoachCountdown(this, () => this.beginRealGame());
      return;
    }
    this.tutorial = createWorkshopTutorial(
      this,
      () => ({
        order: this.currentOrder,
        carried: this.carriedProducts,
        hanging: this.hangingProducts,
        crafting: this.phase === "crafting",
      }),
      () => this.openShelfForOrder(),
      () => {
        markTutorialSeen("ai-workshop");
        if (replaying) {
          this.scene.restart();
          return;
        }
        this.resetForRealGame();
        playCoachCountdown(this, () => this.beginRealGame());
      },
    );
    this.createNextOrder();
  }

  /** The tutorial opens the shelf itself, after its first card. */
  private openShelfForOrder() {
    if (this.finished || this.phase !== "request") return;
    this.phase = "choosing";
    this.spawnProductChoices();
  }

  /** The tutorial customer does not count toward the real game. */
  private resetForRealGame() {
    this.tutorial = undefined;
    this.customerNumber = 0;
    this.completedCustomers = 0;
    this.coins = 0;
    this.wrongDeliveries = 0;
    this.remainingMs = AI_WORKSHOP_CONFIG.gameDurationMs;
    this.updateHud();
    this.promptText?.setText("");
    syncWorkshopDialoguePanel(this.dialoguePanel, this.dialogueText?.setText(""));
  }

  /** Starts the timed game. */
  private beginRealGame() {
    if (this.finished) return;
    this.tutorial = undefined;
    this.timerRunning = true;
    this.createNextOrder();
  }

  private resetState() {
    this.earnedStars = undefined;
    this.tutorial = undefined;
    this.timerRunning = false;
    this.hangingProducts = [];
    this.itemPanel = undefined;
    this.carriedProducts = [];
    this.carriedOrigins = [];
    this.carriedVisuals = [];
    this.currentOrder = undefined;
    this.requestDeck = Phaser.Utils.Array.Shuffle([
      ...this.sessionRequests,
    ]);
    this.phase = "request";
    this.customerNumber = 0;
    this.completedCustomers = 0;
    this.coins = 0;
    this.wrongDeliveries = 0;
    this.remainingMs = AI_WORKSHOP_CONFIG.gameDurationMs;
    this.starCatch?.resetCounts();
    this.joystick.set(0, 0);
    this.actionQueued = false;
    this.finished = false;
  }

  private createNextOrder() {
    if (this.finished) return;
    this.customerNumber += 1;
    if (this.requestDeck.length === 0) {
      this.requestDeck = Phaser.Utils.Array.Shuffle([
        ...this.sessionRequests,
      ]);
    }
    const first = this.requestDeck.pop() ?? WORKSHOP_REQUESTS[0];
    this.currentOrder = createWorkshopOrder(first, WORKSHOP_PRODUCT_BY_ID);
    this.phase = "request";
    this.starCatch?.resetCounts();
    this.clearCarriedProducts();
    this.clearHangingProducts();
    this.customerCountText?.setText(`손님 ${this.customerNumber}명`);
    const customerTexture = `workshop-customer-${first.id}-worried`;
    const hasCustomerTexture = this.textures.exists(customerTexture);
    applyWorkshopCustomerRequestVisual({
      customerArt: this.customerArt,
      customerShadow: this.customerShadow,
      customerEmoji: this.customerEmoji,
      requestId: first.id,
      textureKey: customerTexture,
      fallbackEmoji: first.customerEmoji,
      hasTexture: hasCustomerTexture,
    });
    setWorkshopCustomerRole(this.customerRoleText, first.customerRole);
    this.dialogueText?.setText("");
    this.customerContainer
      ?.setPosition(-170, AI_WORKSHOP_LAYOUT.customerStage.y)
      .setAlpha(1);
    const beginDialogue = () => {
      this.typeDialogue(first.dialogue, () => {
        if (this.finished || this.phase !== "request") return;
        if (this.tutorial) {
          // The tutorial explains the request first; the shelf waits.
          this.tutorial.notify("request-read");
          return;
        }
        this.openShelfForOrder();
      });
    };
    if (this.customerContainer) {
      this.tweens.add({
        targets: this.customerContainer,
        x: AI_WORKSHOP_LAYOUT.customerStage.x,
        duration: 520,
        ease: "Back.easeOut",
        onComplete: beginDialogue,
      });
    } else {
      beginDialogue();
    }
  }

  private typeDialogue(
    text: string,
    onComplete?: () => void,
    speed = 25,
  ) {
    this.typingTimer = startWorkshopDialogue(
      this,
      this.dialogueText,
      this.typingTimer,
      text,
      onComplete,
      speed,
    );
  }

  private spawnProductChoices() {
    const order = this.currentOrder;
    if (!order) return;
    this.clearHangingProducts();
    showWorkshopItemPanel(this, this.itemPanel, this.customerNumber);
    this.hangingProducts = createWorkshopProductChoices(
      this,
      order,
      this.customerNumber,
    );
    this.hangingProducts.forEach((choice) => this.tapTargets?.makeProductTappable(choice));
    this.promptText?.setText("");
    this.tutorial?.notify("choosing");
  }

  private clearHangingProducts() {
    this.hangingProducts.forEach(({ container }) => container.destroy(true));
    this.hangingProducts = [];
    hideWorkshopItemPanel(this, this.itemPanel);
  }

  private clearCarriedProducts() {
    this.carriedProducts = [];
    this.carriedOrigins = [];
    this.carriedVisuals.forEach((visual) => visual.destroy(true));
    this.carriedVisuals = [];
    this.tapTargets?.syncSlots();
  }

  private updateCarriedVisuals() {
    this.carriedVisuals = rebuildWorkshopCarriedVisuals(
      this, this.player, this.carriedProducts, this.carriedVisuals,
      // Blueprints until crafting is done; then the finished products.
      this.phase === "delivery" ? "finished" : "blueprint",
    );
    this.tapTargets?.syncSlots();
  }

  /** Puts carried product `index` back on its shelf slot. */
  private returnCarriedProduct(index: number) {
    const product = this.carriedProducts.splice(index, 1)[0];
    const origin = this.carriedOrigins.splice(index, 1)[0];
    if (!product || !origin) return;
    const choice = returnWorkshopProductToPanel(this, product, origin);
    this.tapTargets?.makeProductTappable(choice);
    this.hangingProducts.push(choice);
    this.updateCarriedVisuals();
    this.promptText?.setText("상품을 원래 칸에 다시 놓았어요");
  }

  /** Takes a product off the shelf (or swaps it for the one carried when the hands are full). */
  private pickProduct(choice: WorkshopProductChoice) {
    const order = this.currentOrder;
    if (!order || !this.player) return;
    const handsFull = this.carriedProducts.length >= order.products.length;
    const returnedProduct = handsFull ? this.carriedProducts[0] : undefined;
    const returnedOrigin = handsFull ? this.carriedOrigins[0] : undefined;
    choice.container.destroy(true);
    this.hangingProducts = this.hangingProducts.filter((entry) => entry !== choice);
    if (handsFull) {
      this.carriedProducts = [choice.product];
      this.carriedOrigins = [choice.origin];
      if (returnedProduct && returnedOrigin) {
        const returned = returnWorkshopProductToPanel(this, returnedProduct, returnedOrigin);
        this.tapTargets?.makeProductTappable(returned);
        this.hangingProducts.push(returned);
      }
    } else {
      this.carriedProducts.push(choice.product);
      this.carriedOrigins.push(choice.origin);
    }
    this.updateCarriedVisuals();
    playWorkshopSound(this, "pick");
    createWorkshopSparkBurst(this, this.player.x, this.player.y - 65, choice.product.color);
    this.promptText?.setText(
      handsFull
        ? "상품을 바꿨어요! 작업대로 가져가거나 다시 바꿀 수 있어요"
        : this.carriedProducts.length < order.products.length
          ? "상품을 하나 더 골라 주세요"
          : "작업대로 가져가거나 다른 상품을 눌러 바꿀 수 있어요",
    );
    this.tutorial?.notify("picked");
  }

  private useWorkbench() {
    const order = this.currentOrder;
    if (!order) return;
    if (this.carriedProducts.length < order.products.length) {
      this.promptText?.setText("먼저 상품을 골라서 가져와 주세요");
      return;
    }
    this.checkProductsAtWorkbench();
  }

  /** Space / Enter: the same actions, on whatever is nearest. */
  private interact() {
    if (this.finished) return;
    if (this.phase === "crafting") {
      this.starCatch?.tryCatch(() => this.completeCrafting());
      return;
    }
    if (!this.player || !this.currentOrder) return;

    if (this.phase === "choosing") {
      const returnTarget = findNearestWorkshopProductOrigin(this.player, this.carriedOrigins);
      if (returnTarget) {
        this.returnCarriedProduct(returnTarget.index);
        return;
      }
      const nearbyProduct = findNearestWorkshopProduct(this.player, this.hangingProducts);
      if (nearbyProduct) {
        this.pickProduct(nearbyProduct);
        return;
      }
      if (isWorkshopPlayerAtWorkbench(this.player)) this.useWorkbench();
      return;
    }

    if (this.phase === "delivery" && isWorkshopPlayerAtCustomer(this.player)) {
      this.completeCustomer();
    }
  }

  private checkProductsAtWorkbench() {
    const order = this.currentOrder;
    if (!order) return;
    const correct = isWorkshopDeliveryCorrect(
      order.products,
      this.carriedProducts,
    );
    if (correct) {
      this.clearHangingProducts();
      this.clearCarriedProducts();
      this.startStarCatch();
      return;
    }

    // A wrong pick in the tutorial is a lesson, not a mistake.
    if (!this.tutorial) this.wrongDeliveries += 1;
    playWorkshopSound(this, "wrong");
    this.updateHud();
    this.phase = "transition";
    this.cameras.main.shake(160, 0.005);
    vibrateDevice([35, 40, 35]);
    const firstRequest = order.requests[0];
    const reply = Phaser.Utils.Array.GetRandom(firstRequest.wrongReplies);
    this.typeDialogue(reply);
    if (this.customerContainer) {
      this.tweens.add({
        targets: this.customerContainer,
        x: 170,
        angle: 3,
        duration: 70,
        yoyo: true,
        repeat: 3,
      });
    }
    this.clearCarriedProducts();
    this.clearHangingProducts();
    if (this.wrongDeliveries >= AI_WORKSHOP_CONFIG.maxWrongDeliveries) {
      this.time.delayedCall(1_150, () => this.finishGame(false));
      return;
    }
    this.time.delayedCall(1_550, () => {
      if (this.finished) return;
      this.phase = "choosing";
      this.spawnProductChoices();
      this.typeDialogue(firstRequest.dialogue);
    });
  }

  private startStarCatch() {
    const order = this.currentOrder;
    if (!order) return;
    this.phase = "crafting";
    this.controls?.cancelWalk();
    this.starCatch?.start(order, this.customerNumber, () => {
      this.actionQueued = true;
    });
    this.tutorial?.notify("crafting");
  }

  private completeCrafting() {
    const order = this.currentOrder;
    if (!order || this.finished) return;
    // The finished product is shown off first, then lands in Midi's hands.
    this.phase = "transition";
    this.starCatch?.destroy();
    this.carriedProducts = [];
    this.carriedOrigins = [];
    this.updateCarriedVisuals();
    this.promptText?.setText("");
    this.workbenchGlow?.setFillStyle(COLORS.yellow, 0.42);
    playWorkshopSound(this, "reveal");
    playWorkshopProductReveal(this, order.products[0], () => ({
      x: this.player?.x ?? AI_WORKSHOP_LAYOUT.workbench.x, y: (this.player?.y ?? 600) - 92,
    }), () => {
      this.workbenchGlow?.setFillStyle(0xffd978, 0.08);
      if (this.finished) return;
      this.phase = "delivery";
      this.carriedProducts = [...order.products];
      this.updateCarriedVisuals();
      if (this.player) createWorkshopSparkBurst(this, this.player.x, this.player.y - 92, COLORS.yellow);
      this.promptText?.setText("완성됐어요! 손님을 눌러 가져다주세요");
      this.tutorial?.notify("delivery");
    });
  }

  private completeCustomer() {
    const order = this.currentOrder;
    if (!order || this.phase !== "delivery") return;
    // Midi can walk around while the customer pays and leaves.
    this.phase = "settling";
    const { reward } = getWorkshopReward(this.customerNumber);
    this.coins += reward;
    this.completedCustomers += 1;
    this.clearCarriedProducts();
    this.updateHud();
    const thanks = `${order.requests[0].thanks} ${reward}코인 받아 주세요!`;
    this.typeDialogue(thanks);
    this.promptText?.setText(`손님 해결! +${reward}코인`);
    playWorkshopSound(this, "coins");
    createWorkshopCoinBurst(this,
      AI_WORKSHOP_LAYOUT.customerStage.x + 145,
      AI_WORKSHOP_LAYOUT.customerStage.y - 118,
      this.coinText,
      Math.max(1, Math.round(reward / 10)),
    );
    createCustomerJoyEffect(this, this.customerContainer);
    animateWorkshopCustomerArtworkJoy(
      this,
      this.customerArt,
      this.customerShadow,
      `workshop-customer-${order.requests[0].id}-happy`,
      order.requests[0].id,
    );
    this.time.delayedCall(1_900, () => {
      if (!this.customerContainer || this.finished) return;
      this.tweens.add({
        targets: this.customerContainer,
        x: -180,
        alpha: 0,
        duration: 470,
        ease: "Back.easeIn",
        onComplete: () => {
          if (!this.tutorial) {
            this.createNextOrder();
            return;
          }
          syncWorkshopDialoguePanel(this.dialoguePanel, this.dialogueText?.setText(""));
          this.tutorial.notify("served");
        },
      });
    });
  }

  private updateHud() {
    renderWorkshopHud({
      coinText: this.coinText,
      mistakeText: this.mistakeText,
      timerText: this.timerText,
      coins: this.coins,
      wrongDeliveries: this.wrongDeliveries,
      remainingMs: this.remainingMs,
    });
  }

  private finishGame(timeCompleted: boolean) {
    if (this.finished) return;
    this.finished = true;
    this.earnedStars = getWorkshopStars(this.coins);
    // Saved right away: a replay that does worse must not lose these stars.
    recordActivityStars(this.registry, "ai-workshop", this.earnedStars);
    this.phase = "finished";
    this.typingTimer?.remove(false);
    this.clearHangingProducts();
    this.clearCarriedProducts();
    this.starCatch?.destroy();
    this.customerContainer?.setVisible(false);
    syncWorkshopDialoguePanel(this.dialoguePanel, this.dialogueText?.setText(""));
    this.player?.setVisible(false);

    createWorkshopResultOverlay(this, {
      timeCompleted,
      completedCustomers: this.completedCustomers,
      coins: this.coins,
      stars: this.earnedStars,
      onRetry: () => this.scene.restart(),
      onWorld: () => this.returnToWorld(),
    });
  }

  private updatePlayer(delta: number) {
    this.playerFacing = updateWorkshopPlayer({
      scene: this,
      player: this.player,
      playerSprite: this.playerSprite,
      playerFacing: this.playerFacing,
      carriedVisuals: this.carriedVisuals,
      joystick: this.joystick,
      cursors: this.cursors,
      keys: this.keys,
      phase: this.phase,
      finished: this.finished,
      delta,
    });
  }

  private returnToWorld() {
    fadeOutOfPlace(this, () =>
      this.scene.start(SCENE_KEYS.world, createWorldReturnSceneData("ai-workshop", this.earnedStars)),
    );
  }
  update(_time: number, delta: number) {
    if (this.finished || isGameStartOverlayOpen(this) || isCoachCardOpen(this)) return;
    const safeDelta = Math.min(delta, 50);
    if (this.timerRunning) this.remainingMs = Math.max(0, this.remainingMs - safeDelta);
    this.updateHud();
    this.tutorial?.update();
    if (this.phase === "transition" && this.wrongDeliveries >= AI_WORKSHOP_CONFIG.maxWrongDeliveries) return;
    this.updateTouchDirection?.();
    this.updatePlayer(safeDelta);
    if (this.phase === "crafting") this.starCatch?.update(safeDelta);
    syncWorkshopDialoguePanel(this.dialoguePanel, this.dialogueText, this.customerArt?.getData(WORKSHOP_CUSTOMER_HEAD_TOP_KEY));

    if (this.keys && (
      Phaser.Input.Keyboard.JustDown(this.keys.action) || Phaser.Input.Keyboard.JustDown(this.keys.enter)
    )) {
      this.interact();
    }
    if (this.actionQueued) {
      this.actionQueued = false;
      this.interact();
    }
    if (this.remainingMs <= 0) this.finishGame(true);
  }
}
