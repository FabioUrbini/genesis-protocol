import type { Game } from '../game/Game';
import { UITheme } from './UITheme';

export class ProgressionUI {
    private container: HTMLDivElement;
    private game: Game;
    private isVisible: boolean = false;
    private currentTab: string = 'level';

    constructor(game: Game) {
        this.game = game;
        this.container = this.createUI();
        document.body.appendChild(this.container);
        this.setupEventListeners();
        this.updateDisplay();
    }

    private createUI(): HTMLDivElement {
        const container = document.createElement('div');
        container.id = 'progression-ui';
        container.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            ${UITheme.getGlassPanel()}
            padding: 30px;
            width: 700px;
            max-height: 80vh;
            overflow-y: auto;
            display: none;
            z-index: 1000;
            border-radius: 16px;
        `;

        container.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="${UITheme.getNeonText('cyan')} margin: 0;">Progression</h2>
                <button id="progression-close" style="${UITheme.getButton()} ${UITheme.getButtonSecondary()}">
                    Close
                </button>
            </div>

            <!-- Tabs -->
            <div style="display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 10px;">
                <button class="prog-tab" data-tab="level" style="${this.getTabStyle(true)}">
                    📊 Level & XP
                </button>
                <button class="prog-tab" data-tab="achievements" style="${this.getTabStyle(false)}">
                    🏆 Achievements
                </button>
                <button class="prog-tab" data-tab="upgrades" style="${this.getTabStyle(false)}">
                    ⬆️ Upgrades
                </button>
                <button class="prog-tab" data-tab="codex" style="${this.getTabStyle(false)}">
                    📖 Pattern Codex
                </button>
            </div>

            <!-- Content -->
            <div id="progression-content"></div>
        `;

        return container;
    }

    private getTabStyle(active: boolean): string {
        return `
            ${UITheme.getButton()}
            background: ${active ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.05)'};
            border: 1px solid ${active ? 'rgba(59, 130, 246, 0.5)' : 'rgba(255,255,255,0.1)'};
            padding: 10px 20px;
            flex: 1;
        `;
    }

    private setupEventListeners(): void {
        // Close button
        const closeBtn = this.container.querySelector('#progression-close');
        closeBtn?.addEventListener('click', () => this.hide());

        // Tab buttons
        this.container.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('prog-tab')) {
                const tab = target.dataset.tab;
                if (tab) {
                    this.switchTab(tab);
                }
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    private switchTab(tab: string): void {
        this.currentTab = tab;

        // Update tab buttons
        this.container.querySelectorAll('.prog-tab').forEach(btn => {
            const element = btn as HTMLElement;
            const isActive = element.dataset.tab === tab;
            element.style.cssText = this.getTabStyle(isActive);
        });

        this.updateDisplay();
    }

    private updateDisplay(): void {
        const content = this.container.querySelector('#progression-content');
        if (!content) return;

        switch (this.currentTab) {
            case 'level':
                content.innerHTML = this.getLevelContent();
                break;
            case 'achievements':
                content.innerHTML = this.getAchievementsContent();
                break;
            case 'upgrades':
                content.innerHTML = this.getUpgradesContent();
                break;
            case 'codex':
                content.innerHTML = this.getCodexContent();
                break;
        }
    }

    private getLevelContent(): string {
        const level = this.game.progressionSystem.getLevel();
        const totalXP = this.game.progressionSystem.getTotalXP();
        const progressPercent = (level.xp / level.xpForNextLevel) * 100;

        const unlocks = this.game.progressionSystem.getUnlocks();
        const unlockedCount = unlocks.filter(u => u.unlocked).length;

        return `
            <div style="${UITheme.getGlassCard()} padding: 20px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <div>
                        <div style="font-size: 32px; font-weight: bold; ${UITheme.getNeonText('cyan')}">
                            Level ${level.level}
                        </div>
                        <div style="color: rgba(255,255,255,0.6); margin-top: 5px;">
                            Total XP: ${totalXP}
                        </div>
                    </div>
                </div>

                <div style="margin-bottom: 10px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="color: rgba(255,255,255,0.8);">Progress to Level ${level.level + 1}</span>
                        <span style="color: rgba(255,255,255,0.6);">${level.xp} / ${level.xpForNextLevel} XP</span>
                    </div>
                    <div style="width: 100%; height: 20px; background: rgba(0,0,0,0.3); border-radius: 10px; overflow: hidden;">
                        <div style="width: ${progressPercent}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #06b6d4); transition: width 0.3s ease;"></div>
                    </div>
                </div>
            </div>

            <div style="${UITheme.getGlassCard()} padding: 20px;">
                <h3 style="margin: 0 0 15px 0; color: white;">Unlocks (${unlockedCount}/${unlocks.length})</h3>
                <div style="display: flex; flex-direction: column; gap: 10px; max-height: 300px; overflow-y: auto;">
                    ${unlocks.map(unlock => `
                        <div style="padding: 12px; background: ${unlock.unlocked ? 'rgba(74, 222, 128, 0.1)' : 'rgba(255,255,255,0.05)'};
                                    border-radius: 8px; border-left: 3px solid ${unlock.unlocked ? '#4ade80' : 'rgba(255,255,255,0.2)'};">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <div style="font-weight: 600; color: ${unlock.unlocked ? '#4ade80' : 'white'};">
                                        ${unlock.unlocked ? '✓' : '🔒'} ${unlock.name}
                                    </div>
                                    <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 4px;">
                                        ${unlock.description}
                                    </div>
                                </div>
                                ${unlock.requiredLevel ? `
                                    <div style="padding: 4px 8px; background: rgba(255,255,255,0.1); border-radius: 6px; font-size: 12px;">
                                        Lv. ${unlock.requiredLevel}
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    private getAchievementsContent(): string {
        const achievements = this.game.achievementSystem.getAllAchievements();
        const stats = this.game.achievementSystem.getStats();
        const completionPercent = this.game.achievementSystem.getCompletionPercentage();

        return `
            <div style="${UITheme.getGlassCard()} padding: 20px; margin-bottom: 20px;">
                <div style="font-size: 24px; font-weight: bold; ${UITheme.getNeonText('cyan')} margin-bottom: 10px;">
                    ${stats.unlocked} / ${stats.total} Achievements
                </div>
                <div style="width: 100%; height: 16px; background: rgba(0,0,0,0.3); border-radius: 8px; overflow: hidden; margin-bottom: 10px;">
                    <div style="width: ${completionPercent}%; height: 100%; background: linear-gradient(90deg, #fbbf24, #f59e0b);"></div>
                </div>
                <div style="display: flex; gap: 15px; color: rgba(255,255,255,0.7); font-size: 12px;">
                    <span>🟢 ${stats.common} Common</span>
                    <span>🔵 ${stats.uncommon} Uncommon</span>
                    <span>🟣 ${stats.rare} Rare</span>
                    <span>🟠 ${stats.epic} Epic</span>
                    <span>🔴 ${stats.legendary} Legendary</span>
                </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 10px; max-height: 400px; overflow-y: auto;">
                ${achievements.filter(a => !a.hidden || a.unlocked).map(ach => {
                    const rarityColors: { [key: string]: string } = {
                        'common': '#9ca3af',
                        'uncommon': '#3b82f6',
                        'rare': '#a855f7',
                        'epic': '#f59e0b',
                        'legendary': '#ef4444'
                    };
                    const color = rarityColors[ach.rarity];

                    return `
                        <div style="${UITheme.getGlassCard()} padding: 15px; ${ach.unlocked ? `border: 1px solid ${color}22;` : 'opacity: 0.6;'}">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: ${ach.unlocked ? color : 'white'}; margin-bottom: 5px;">
                                        ${ach.unlocked ? '🏆' : '🔒'} ${ach.name}
                                    </div>
                                    <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 8px;">
                                        ${ach.description}
                                    </div>
                                    ${ach.progress > 0 && !ach.unlocked ? `
                                        <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.3); border-radius: 4px; overflow: hidden;">
                                            <div style="width: ${(ach.progress / ach.maxProgress) * 100}%; height: 100%; background: ${color};"></div>
                                        </div>
                                        <div style="font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px;">
                                            ${ach.progress} / ${ach.maxProgress}
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="text-align: right; margin-left: 15px;">
                                    <div style="padding: 4px 8px; background: ${color}22; color: ${color}; border-radius: 6px; font-size: 11px; font-weight: 600; margin-bottom: 5px;">
                                        ${ach.rarity.toUpperCase()}
                                    </div>
                                    <div style="font-size: 12px; color: rgba(255,255,255,0.6);">
                                        +${ach.xpReward} XP
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    private getUpgradesContent(): string {
        const upgrades = this.game.progressionSystem.getUpgrades();
        const categories = ['player', 'suit', 'building', 'time', 'ca'];

        return `
            <div style="display: flex; flex-direction: column; gap: 20px; max-height: 500px; overflow-y: auto;">
                ${categories.map(category => {
                    const categoryUpgrades = upgrades.filter(u => u.category === category);
                    if (categoryUpgrades.length === 0) return '';

                    return `
                        <div>
                            <h3 style="margin: 0 0 10px 0; color: white; text-transform: capitalize;">
                                ${category} Upgrades
                            </h3>
                            <div style="display: flex; flex-direction: column; gap: 10px;">
                                ${categoryUpgrades.map(upgrade => `
                                    <div style="${UITheme.getGlassCard()} padding: 15px;">
                                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                                            <div>
                                                <div style="font-weight: 600; color: white;">${upgrade.name}</div>
                                                <div style="font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px;">
                                                    ${upgrade.description}
                                                </div>
                                            </div>
                                            <div style="text-align: right;">
                                                <div style="font-size: 14px; font-weight: 600; color: #3b82f6;">
                                                    Level ${upgrade.currentLevel}/${upgrade.maxLevel}
                                                </div>
                                            </div>
                                        </div>
                                        <div style="width: 100%; height: 6px; background: rgba(0,0,0,0.3); border-radius: 3px; overflow: hidden;">
                                            <div style="width: ${(upgrade.currentLevel / upgrade.maxLevel) * 100}%; height: 100%; background: linear-gradient(90deg, #3b82f6, #06b6d4);"></div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    private getCodexContent(): string {
        const stats = this.game.patternCodex.getStats();
        const patterns = this.game.patternCodex.getAllPatterns();
        const recent = this.game.patternCodex.getRecentDiscoveries(5);

        return `
            <div style="${UITheme.getGlassCard()} padding: 20px; margin-bottom: 20px;">
                <div style="font-size: 24px; font-weight: bold; ${UITheme.getNeonText('cyan')} margin-bottom: 10px;">
                    ${stats.totalDiscovered} / ${stats.totalPatterns} Patterns Discovered
                </div>
                <div style="width: 100%; height: 16px; background: rgba(0,0,0,0.3); border-radius: 8px; overflow: hidden;">
                    <div style="width: ${stats.completionPercentage}%; height: 100%; background: linear-gradient(90deg, #a855f7, #ec4899);"></div>
                </div>
            </div>

            ${recent.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="margin: 0 0 10px 0; color: white;">Recently Discovered</h3>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        ${recent.map(p => `
                            <div style="${UITheme.getGlassCard()} padding: 12px; border-left: 3px solid #a855f7;">
                                <div style="font-weight: 600; color: #a855f7;">${p.name}</div>
                                <div style="font-size: 12px; color: rgba(255,255,255,0.6);">${p.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div style="max-height: 300px; overflow-y: auto;">
                <h3 style="margin: 0 0 10px 0; color: white;">All Patterns</h3>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                    ${patterns.filter(p => p.discovered).map(pattern => `
                        <div style="${UITheme.getGlassCard()} padding: 15px;">
                            <div style="display: flex; justify-content: between; align-items: flex-start;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; color: white; margin-bottom: 5px;">
                                        📖 ${pattern.name}
                                    </div>
                                    <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 5px;">
                                        ${pattern.description}
                                    </div>
                                    <div style="font-size: 12px; color: rgba(255,255,255,0.5);">
                                        ${pattern.behavior} • Spotted ${pattern.timesSpotted}x
                                    </div>
                                    ${pattern.lore ? `
                                        <div style="font-size: 12px; color: rgba(168, 85, 247, 0.8); font-style: italic; margin-top: 8px;">
                                            "${pattern.lore}"
                                        </div>
                                    ` : ''}
                                </div>
                                <div style="padding: 4px 8px; background: rgba(168, 85, 247, 0.2); color: #a855f7; border-radius: 6px; font-size: 11px; font-weight: 600; margin-left: 15px;">
                                    ${pattern.rarity.toUpperCase()}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    public show(): void {
        this.container.style.display = 'block';
        this.isVisible = true;
        this.updateDisplay();
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

    public refresh(): void {
        if (this.isVisible) {
            this.updateDisplay();
        }
    }

    public dispose(): void {
        this.container.remove();
    }
}
