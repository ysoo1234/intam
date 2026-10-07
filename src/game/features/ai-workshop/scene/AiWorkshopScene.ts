import Phaser from "phaser";
import { GAME_ASSETS } from "../../../assets";
import type { ControlKeys } from "../../../core/input/controlKeys";
import type { PlayerFacing } from "../../../core/player/playerFacing";
import { createWorldReturnSceneData } from "../../../core/navigation";
import { configureSceneCamera } from "../../../core/runtime/configureSceneCamera";
import { SCENE_KEYS } from "../../../core/scenes/sceneKeys";
import { generateCustomerTexture, generatePlayerTexture } from "../../../core/visual/fallbackTextures";
import { preloadGameChromeAssets } from "../../../core/visual/gameChrome";
import { preloadGameResultOverlayAssets } from "../../../core/visual/gameResultOverlay";
import { createGameStartOverlay, isGameStartOverlayOpen, preloadGameStartOverlayAssets } from "../../../core/visual/gameStartOverlay";
import { AI_WORKSHOP_START } from "./workshopStart";
import { COLORS } from "../../../core/visual/theme";
import { WORKSHOP_PRODUCT_BY_ID, WORKSHOP_REQUESTS, type WorkshopProduct, type WorkshopRequest } from "../../../content/aiWorkshop";
import {
  AI_WORKSHOP_CONFIG,
  createWorkshopOrder,
  getStarCatchDifficulty,
  getWorkshopReward,
  getWorkshopStars,
  isWorkshopDeliveryCorrect,
  type WorkshopOrder,
  type WorkshopPhase,
} from "../model";
import { AI_WORKSHOP_LAYOUT } from "./layout";
import { startWorkshopDialogue } from "./workshopDialogue";
import { createWorkshopControls } from "./workshopControls";
import { applyWorkshopCustomerRequestVisual } from "./workshopCustomerVisual";
import { animateWorkshopCustomerArtworkJoy, createCustomerJoyEffect, createWorkshopCoinBurst, createWorkshopSparkBurst } from "./workshopEffects";
import { createWorkshopCraftingAnimation } from "./workshopCraftingView";
import {
  preloadWorkshopSceneAssets,
  unloadWorkshopSceneAssets,
} from "./workshopAssets";
import { createWorkshopItemPanel, createWorkshopProductChoices, hideWorkshopItemPanel, rebuildWorkshopCarriedVisuals, returnWorkshopProductToPanel, showWorkshopItemPanel, type WorkshopProductChoice, type WorkshopProductOrigin } from "./workshopProducts";
import { updateWorkshopPlayer, updateWorkshopPlayerPerspective } from "./workshopPlayer";
import { createWorkshopResultOverlay } from "./workshopResult";
import {
  createWorkshopStarCatchView,
  drawWorkshopStarZone,
  randomizeWorkshopStarZone,
  WORKSHOP_STAR_CATCH_HALF_WIDTH, WORKSHOP_STAR_CATCH_TRACK_Y, WORKSHOP_STAR_CATCH_TUNING,
} from "./workshopStarCatchView";
import { findNearestWorkshopProduct, findNearestWorkshopProductOrigin, renderWorkshopHud, updateWorkshopInteractionPrompt, vibrateDevice } from "./workshopStatus";
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
  private dialoguePanel?: Phaser.GameObjects.Image;
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
  private actionText?: Phaser.GameObjects.Text;
  private actionButton?: Phaser.GameObjects.Container;
  private workbenchGlow?: Phaser.GameObjects.Rectangle;
  private workbenchSprite?: Phaser.GameObjects.Image;
  private joystick = new Phaser.Math.Vector2();
  private updateTouchDirection?: () => void;
  private actionQueued = false;
  private starCatchContainer?: Phaser.GameObjects.Container;
  private starMarker?: Phaser.GameObjects.Graphics;
  private starStatusText?: Phaser.GameObjects.Text;
  private craftingAnimationContainer?: Phaser.GameObjects.Container;
  private craftingSparkTimer?: Phaser.Time.TimerEvent;
  private starZoneCenter = 0;
  private starZoneWidth = 120;
  private starX = -WORKSHOP_STAR_CATCH_HALF_WIDTH;
  private starDirection: 1 | -1 = 1;
  private starHits = 0;
  private starMisses = 0;
  private starCatchLocked = false;
  private finished = false;
  private earnedStars?: 1 | 2 | 3;

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
    if (!this.textures.exists("player-front")) {
      this.load.image("player-front", GAME_ASSETS.characters.player.front);
      this.load.image("player-back", GAME_ASSETS.characters.player.back);
      this.load.image("player-left", GAME_ASSETS.characters.player.left);
      this.load.image("player-right", GAME_ASSETS.characters.player.right);
    }
  }

  create() {
    configureSceneCamera(this, this.renderScale);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unloadWorkshopSceneAssets(this);
      [
        ...Object.keys(GAME_ASSETS.shop.products).map(
          (productId) => `workshop-product-${productId}`,
        ),
      ].forEach((key) => this.textures.remove(key));
      this.sessionRequests.forEach((request) => {
        this.textures.remove(`workshop-customer-${request.id}-worried`);
        this.textures.remove(`workshop-customer-${request.id}-happy`);
      });
    });
    generatePlayerTexture(this);
    generateCustomerTexture(this);
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
    } = createWorkshopHud(this, () => this.returnToWorld()));
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
    ({
      keys: this.keys,
      cursors: this.cursors,
      joystick: this.joystick,
      updateTouchDirection: this.updateTouchDirection,
      actionButton: this.actionButton,
      actionText: this.actionText,
    } = createWorkshopControls(
      this,
      () => this.returnToWorld(),
      () => {
        this.actionQueued = true;
      },
      () => this.player,
    ));
    createGameStartOverlay(this, AI_WORKSHOP_START, () => this.createNextOrder());
    this.cameras.main.fadeIn(320, 255, 244, 210);
  }

  private resetState() {
    this.earnedStars = undefined;
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
    this.starHits = 0;
    this.starMisses = 0;
    this.starCatchLocked = false;
    this.craftingAnimationContainer = undefined;
    this.craftingSparkTimer = undefined;
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
    this.starHits = 0;
    this.starMisses = 0;
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
        if (!this.finished && this.phase === "request") {
          this.phase = "choosing";
          this.spawnProductChoices();
        }
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
    this.promptText?.setText("");
    this.actionText?.setText("집기");
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
  }

  private updateCarriedVisuals() {
    this.carriedVisuals = rebuildWorkshopCarriedVisuals(
      this, this.player, this.carriedProducts, this.carriedVisuals,
    );
  }

  private interact() {
    if (this.finished) return;
    if (this.phase === "crafting") {
      this.tryStarCatch();
      return;
    }
    if (!this.player || !this.currentOrder) return;

    if (this.phase === "choosing") {
      const returnTarget = findNearestWorkshopProductOrigin(
        this.player,
        this.carriedOrigins,
      );
      if (returnTarget) {
        const product = this.carriedProducts.splice(returnTarget.index, 1)[0];
        const origin = this.carriedOrigins.splice(returnTarget.index, 1)[0];
        if (product && origin) {
          this.hangingProducts.push(
            returnWorkshopProductToPanel(this, product, origin),
          );
          this.updateCarriedVisuals();
          this.promptText?.setText("상품을 원래 칸에 다시 놓았어요");
        }
        return;
      }
      const nearbyProduct = findNearestWorkshopProduct(
        this.player,
        this.hangingProducts,
      );
      if (nearbyProduct) {
        if (
          this.carriedProducts.length >= this.currentOrder.products.length
        ) {
          const returnedProduct = this.carriedProducts[0];
          const returnedOrigin = this.carriedOrigins[0];
          nearbyProduct.container.destroy(true);
          this.hangingProducts = this.hangingProducts.filter(
            (entry) => entry !== nearbyProduct,
          );
          this.carriedProducts = [nearbyProduct.product];
          this.carriedOrigins = [nearbyProduct.origin];
          if (returnedProduct && returnedOrigin)
            this.hangingProducts.push(
              returnWorkshopProductToPanel(
                this,
                returnedProduct,
                returnedOrigin,
              ),
            );
          this.updateCarriedVisuals();
          createWorkshopSparkBurst(this, 
            this.player.x,
            this.player.y - 65,
            nearbyProduct.product.color,
          );
          this.promptText?.setText(
            "상품을 바꿨어요! 작업대로 가져가거나 다시 바꿀 수 있어요",
          );
          return;
        }
        this.carriedProducts.push(nearbyProduct.product);
        this.carriedOrigins.push(nearbyProduct.origin);
        nearbyProduct.container.destroy(true);
        this.hangingProducts = this.hangingProducts.filter(
          (entry) => entry !== nearbyProduct,
        );
        this.updateCarriedVisuals();
        createWorkshopSparkBurst(this, this.player.x, this.player.y - 65, nearbyProduct.product.color);
        this.promptText?.setText(
          this.carriedProducts.length < this.currentOrder.products.length
            ? "상품을 하나 더 골라 주세요"
            : "작업대로 가져가거나 다른 상품 앞에서 바꿀 수 있어요",
        );
        return;
      }

      const atWorkbench =
        Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          AI_WORKSHOP_LAYOUT.workbench.x,
          AI_WORKSHOP_LAYOUT.workbench.interactionY,
        ) < 150;
      if (
        atWorkbench &&
        this.carriedProducts.length < this.currentOrder.products.length
      ) {
        this.promptText?.setText("먼저 상품을 골라서 가져와 주세요");
        return;
      }
      if (atWorkbench) this.checkProductsAtWorkbench();
      return;
    }

    if (
      this.phase === "delivery" &&
      Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        AI_WORKSHOP_LAYOUT.customerInteraction.x,
        AI_WORKSHOP_LAYOUT.customerInteraction.y,
      ) < AI_WORKSHOP_LAYOUT.customerInteraction.radius
    ) {
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

    this.wrongDeliveries += 1;
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
    this.starHits = 0;
    this.starMisses = 0;
    this.starCatchLocked = false;
    this.starDirection = 1;
    this.starX = -WORKSHOP_STAR_CATCH_HALF_WIDTH;
    this.promptText?.setText(
      `빛나는 구역에서 멈추세요 · 성공 0 / ${order.requiredStarHits}`,
    );
    this.actionText?.setText("멈춤!");
    this.createStarCatchPanel();
    this.createWorkbenchCraftingAnimation();
  }

  private createStarCatchPanel() {
    const order = this.currentOrder;
    if (!order) return;
    this.starCatchContainer?.destroy(true);
    this.starZoneWidth = getStarCatchDifficulty(this.customerNumber).zoneWidth;
    this.starZoneCenter = randomizeWorkshopStarZone();
    const view = createWorkshopStarCatchView(
      this,
      order,
      this.starX,
      this.starZoneCenter,
      this.starZoneWidth,
    );
    this.starCatchContainer = view.container;
    this.starMarker = view.marker;
    this.starStatusText = view.statusText;
  }

  private createWorkbenchCraftingAnimation() {
    this.clearWorkbenchCraftingAnimation();
    const product = this.currentOrder?.products[0];
    if (!product) return;
    const animation = createWorkshopCraftingAnimation(
      this,
      product,
      () => this.phase === "crafting",
    );
    this.craftingAnimationContainer = animation.container;
    this.craftingSparkTimer = animation.timer;
  }

  private clearWorkbenchCraftingAnimation() {
    this.craftingSparkTimer?.remove(false);
    this.craftingSparkTimer = undefined;
    this.craftingAnimationContainer?.destroy(true);
    this.craftingAnimationContainer = undefined;
  }

  private resetStarCatchRound() {
    if (!this.starCatchContainer || !this.currentOrder) return;
    this.starCatchLocked = false;
    this.starX = this.starDirection === 1 ? -WORKSHOP_STAR_CATCH_HALF_WIDTH : WORKSHOP_STAR_CATCH_HALF_WIDTH;
    this.starZoneCenter = randomizeWorkshopStarZone();
    const zone = this.starCatchContainer.getByName("star-zone") as Phaser.GameObjects.Graphics | null;
    if (zone) {
      drawWorkshopStarZone(zone, this.starZoneCenter, this.starZoneWidth);
    }
    this.starMarker
      ?.setPosition(
        WORKSHOP_STAR_CATCH_TUNING.trackX + this.starX,
        WORKSHOP_STAR_CATCH_TRACK_Y,
      )
      .setAlpha(1)
      .setScale(1)
      .setAngle(0);
  }

  private tryStarCatch() {
    const order = this.currentOrder;
    if (
      !order ||
      this.phase !== "crafting" ||
      this.starCatchLocked
    ) {
      return;
    }
    this.starCatchLocked = true;
    const success =
      Math.abs(this.starX - this.starZoneCenter) <= this.starZoneWidth / 2;
    if (success) {
      this.starHits += 1;
      this.starStatusText?.setText(
        `성공 횟수 ${this.starHits} / ${order.requiredStarHits}`,
      );
      this.promptText?.setText(
        `좋아요! 성공 ${this.starHits} / ${order.requiredStarHits}`,
      );
      this.cameras.main.flash(120, 255, 232, 120);
      createWorkshopSparkBurst(
        this,
        WORKSHOP_STAR_CATCH_TUNING.centerX +
          WORKSHOP_STAR_CATCH_TUNING.trackX +
          this.starX,
        WORKSHOP_STAR_CATCH_TUNING.centerY + WORKSHOP_STAR_CATCH_TRACK_Y,
        COLORS.yellow,
      );
      this.tweens.add({
        targets: this.starMarker,
        scaleX: 1.7,
        scaleY: 1.12,
        duration: 180,
        yoyo: true,
      });
      if (this.starHits >= order.requiredStarHits) {
        this.time.delayedCall(420, () => this.completeCrafting());
        return;
      }
    } else {
      this.starMisses += 1;
      this.starStatusText?.setText(
        `성공 횟수 ${this.starHits} / ${order.requiredStarHits}`,
      );
      this.promptText?.setText("괜찮아요! 성공 횟수는 그대로예요. 다시 도전!");
      this.cameras.main.shake(90, 0.003);
      this.tweens.add({
        targets: this.starMarker,
        y: WORKSHOP_STAR_CATCH_TRACK_Y + 18,
        alpha: 0.25,
        angle: 45,
        duration: 180,
      });
    }
    this.time.delayedCall(430, () => this.resetStarCatchRound());
  }

  private completeCrafting() {
    const order = this.currentOrder;
    if (!order || this.finished) return;
    this.phase = "delivery";
    this.clearWorkbenchCraftingAnimation();
    this.starCatchContainer?.destroy(true);
    this.starCatchContainer = undefined;
    this.carriedProducts = [...order.products];
    this.carriedOrigins = [];
    this.updateCarriedVisuals();
    this.actionText?.setText("전달");
    this.promptText?.setText("완성됐어요! 손님에게 가져다주세요");
    createWorkshopSparkBurst(this, 
      AI_WORKSHOP_LAYOUT.workbench.x,
      AI_WORKSHOP_LAYOUT.workbench.interactionY,
      COLORS.mint,
    );
    this.workbenchGlow?.setFillStyle(COLORS.yellow, 0.42);
    this.time.delayedCall(500, () =>
      this.workbenchGlow?.setFillStyle(0xffd978, 0.08),
    );
  }

  private completeCustomer() {
    const order = this.currentOrder;
    if (!order || this.phase !== "delivery") return;
    this.phase = "transition";
    const { perfectBonus, reward } = getWorkshopReward(
      this.customerNumber,
      this.starMisses,
    );
    this.coins += reward;
    this.completedCustomers += 1;
    this.clearCarriedProducts();
    this.updateHud();
    const thanks = `${order.requests[0].thanks} ${reward}코인 받아 주세요!`;
    this.typeDialogue(thanks);
    this.promptText?.setText(
      perfectBonus > 0
        ? `완벽 제작 보너스! +${reward}코인`
        : `손님 해결! +${reward}코인`,
    );
    createWorkshopCoinBurst(this, 
      AI_WORKSHOP_LAYOUT.customerStage.x + 145,
      AI_WORKSHOP_LAYOUT.customerStage.y - 118,
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
        onComplete: () => this.createNextOrder(),
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
    this.earnedStars = getWorkshopStars(this.completedCustomers);
    this.phase = "finished";
    this.typingTimer?.remove(false);
    this.clearHangingProducts();
    this.clearCarriedProducts();
    this.clearWorkbenchCraftingAnimation();
    this.starCatchContainer?.destroy(true);
    this.starCatchContainer = undefined;
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

  private updateInteractionPrompt() {
    updateWorkshopInteractionPrompt({
      player: this.player,
      actionButton: this.actionButton,
      actionText: this.actionText,
      phase: this.phase,
      finished: this.finished,
      currentOrder: this.currentOrder,
      carriedProductCount: this.carriedProducts.length,
      hangingProducts: this.hangingProducts,
      carriedOrigins: this.carriedOrigins,
    });
  }

  private updateStarCatch(delta: number) {
    if (
      this.phase !== "crafting" ||
      this.starCatchLocked ||
      !this.starMarker ||
      !this.currentOrder
    ) {
      return;
    }
    const speed = getStarCatchDifficulty(this.customerNumber).speed;
    this.starX += this.starDirection * speed * (delta / 1000);
    if (this.starX >= WORKSHOP_STAR_CATCH_HALF_WIDTH) {
      this.starX = WORKSHOP_STAR_CATCH_HALF_WIDTH;
      this.starDirection = -1;
    } else if (this.starX <= -WORKSHOP_STAR_CATCH_HALF_WIDTH) {
      this.starX = -WORKSHOP_STAR_CATCH_HALF_WIDTH;
      this.starDirection = 1;
    }
    this.starMarker.setX(WORKSHOP_STAR_CATCH_TUNING.trackX + this.starX);
  }

  private returnToWorld() {
    this.cameras.main.fadeOut(220, 255, 245, 220);
    this.time.delayedCall(220, () =>
      this.scene.start(SCENE_KEYS.world, createWorldReturnSceneData("ai-workshop", this.earnedStars)),
    );
  }
  update(_time: number, delta: number) {
    if (this.finished || isGameStartOverlayOpen(this)) return;
    const safeDelta = Math.min(delta, 50);
    this.remainingMs = Math.max(0, this.remainingMs - safeDelta);
    this.updateHud();
    if (this.phase === "transition" && this.wrongDeliveries >= AI_WORKSHOP_CONFIG.maxWrongDeliveries) return;
    this.updateTouchDirection?.();
    this.updatePlayer(safeDelta);
    this.updateStarCatch(safeDelta);
    this.updateInteractionPrompt();
    syncWorkshopDialoguePanel(this.dialoguePanel, this.dialogueText);

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
