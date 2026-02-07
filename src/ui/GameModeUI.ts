import type { Game } from '../game/Game';
import { GameModeType } from '../game/GameMode';
import { UITheme } from './UITheme';

export class GameModeUI {
    private container: HTMLDivElement;
    private game: Game;
    private isVisible: boolean = false;

    constructor(game: Game) {
        this.game = game;
        this.container = this.createUI();
        document.body.appendChild(this.container);
        this.setupEventListeners();
    }

    private createUI(): HTMLDivElement {
        const container = document.createElement('div');
        container.id = 'game-mode-ui';
        container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            ${UITheme.getGlassPanel()}
            padding: 30px;
            min-width: 500px;
            max-width: 700px;
            display: none;
            z-index: 1000;
            border-radius: 16px;
        `;

        container.innerHTML = `
            <h2 style="${UITheme.getNeonText('cyan')} margin: 0 0 20px 0; text-align: center;">Select Game Mode</h2>

            <div id="game-mode-list" style="display: flex; flex-direction: column; gap: 15px;">
                ${this.createModeCard(GameModeType.SURVIVAL,
                    '🛡️ Survival Mode',
                    'Survive increasingly difficult waves of hostile patterns. Gather resources and build defenses.',
                    'Hard')}

                ${this.createModeCard(GameModeType.EXPLORER,
                    '🗺️ Explorer Mode',
                    'Explore the infinite world, discover biomes, and catalog patterns. No pressure, just discovery.',
                    'Easy')}

                ${this.createModeCard(GameModeType.ARCHITECT,
                    '🏗️ Architect Mode',
                    'Unlimited resources and full time control. Build, experiment, and create without limits.',
                    'Creative')}

                ${this.createModeCard(GameModeType.PUZZLE,
                    '🧩 Puzzle Mode',
                    'Solve CA pattern puzzles. Achieve specific goals with limited moves and resources.',
                    'Medium')}
            </div>

            <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                <button id="game-mode-cancel" style="${UITheme.getButton()} ${UITheme.getButtonSecondary()}">
                    Cancel
                </button>
                <div style="color: rgba(255,255,255,0.5); font-size: 12px;">
                    Press ESC to close
                </div>
            </div>
        `;

        return container;
    }

    private createModeCard(type: GameModeType, title: string, description: string, difficulty: string): string {
        const difficultyColors: { [key: string]: string } = {
            'Easy': '#4ade80',
            'Medium': '#fbbf24',
            'Hard': '#f87171',
            'Creative': '#a78bfa'
        };

        return `
            <div class="game-mode-card" data-mode="${type}"
                 style="${UITheme.getGlassCard()}
                        padding: 20px;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        border: 2px solid rgba(255,255,255,0.1);">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <h3 style="margin: 0; color: white; font-size: 20px;">${title}</h3>
                    <span style="padding: 4px 12px;
                                 background: ${difficultyColors[difficulty]}22;
                                 color: ${difficultyColors[difficulty]};
                                 border-radius: 12px;
                                 font-size: 12px;
                                 font-weight: 600;">
                        ${difficulty}
                    </span>
                </div>
                <p style="margin: 0; color: rgba(255,255,255,0.7); line-height: 1.5;">
                    ${description}
                </p>
            </div>
        `;
    }

    private setupEventListeners(): void {
        // Mode selection
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            const modeCard = target.closest('.game-mode-card') as HTMLElement;

            if (modeCard) {
                const mode = modeCard.dataset.mode as GameModeType;
                this.selectMode(mode);
            }
        });

        // Cancel button
        const cancelBtn = this.container.querySelector('#game-mode-cancel');
        cancelBtn?.addEventListener('click', () => this.hide());

        // Hover effects
        this.container.querySelectorAll('.game-mode-card').forEach(card => {
            const element = card as HTMLElement;

            element.addEventListener('mouseenter', () => {
                element.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                element.style.transform = 'translateY(-2px)';
                element.style.boxShadow = '0 8px 32px rgba(59, 130, 246, 0.2)';
            });

            element.addEventListener('mouseleave', () => {
                element.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                element.style.transform = 'translateY(0)';
                element.style.boxShadow = 'none';
            });
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    private selectMode(type: GameModeType): void {
        console.log(`Selected game mode: ${type}`);
        this.game.startGameMode(type);
        this.hide();
    }

    public show(): void {
        this.container.style.display = 'block';
        this.isVisible = true;
    }

    public hide(): void {
        this.container.style.display = 'none';
        this.isVisible = false;
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    public dispose(): void {
        this.container.remove();
    }
}
