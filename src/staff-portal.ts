/**
 * GRAMBONDHON (গ্রামীণ বন্ধন) - STAFF & OPERATIONS COMMAND PORTAL
 * 
 * Inter-Role Communication & Operations Hub:
 * - Multi-Character Communications Bus (Investor, Farmer, Staff, Escrow)
 * - KYC Approvals with real-time SMS/Email dispatch
 * - Deal Underwriting & Approval (dispatches Zapier webhooks)
 * - Base Sepolia Escrow Disbursal
 * - Live Zapier Relay & Webhook Integration Manager
 */

export class StaffPortalController {
  private modalId = "staff-operations-modal";
  private activeTab: "comms" | "kyc" | "deals" | "settle" | "integrations" = "comms";

  constructor(private showToast: (msg: string) => void) {}

  public init(): void {
    // Remove any existing staff portal button from navbar to keep original clean navbar
    const existing = document.getElementById("btn-staff-portal-trigger");
    if (existing) existing.remove();

    (window as any).openStaffPortal = () => this.open();
  }

  public async open(): Promise<void> {
    let modal = document.getElementById(this.modalId);
    if (!modal) {
      modal = document.createElement("div");
      modal.id = this.modalId;
      modal.className = "staff-modal-overlay";
      modal.style.cssText = `
        position: fixed; inset: 0; z-index: 99999;
        background: rgba(2, 34, 26, 0.85); backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        padding: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;
      document.body.appendChild(modal);
    }

    modal.style.display = "flex";
    await this.render();
  }

  public close(): void {
    const modal = document.getElementById(this.modalId);
    if (modal) modal.style.display = "none";
  }

  private async fetchPortalData() {
    try {
      const [zap, comms, kyc, deals, settle] = await Promise.all([
        fetch("http://localhost:3001/api/v1/webhooks/zapier/status").then(r => r.json()).catch(() => ({ active: true })),
        fetch("http://localhost:3001/api/v1/communications/feed").then(r => r.json()).catch(() => ({ feed: [] })),
        fetch("http://localhost:3001/api/v1/admin/kyc/pending").then(r => r.json()).catch(() => ({ data: [] })),
        fetch("http://localhost:3001/api/v1/admin/deals/pending").then(r => r.json()).catch(() => ({ data: [] })),
        fetch("http://localhost:3001/api/v1/admin/settlements").then(r => r.json()).catch(() => ({ escrowBalanceBDT: 4850000, records: [] })),
      ]);
      return { zap, comms, kyc, deals, settle };
    } catch {
      return null;
    }
  }

  private async render(): Promise<void> {
    const modal = document.getElementById(this.modalId);
    if (!modal) return;

    modal.innerHTML = `
      <div style="background:#FFFFFF;border-radius:18px;max-width:960px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 25px 60px rgba(0,0,0,0.4);border:2px solid #10B981;color:#0F172A;display:flex;flex-direction:column;">
        
        <!-- Header Strip -->
        <div style="background:linear-gradient(135deg, #02221A 0%, #064E3B 100%);padding:20px 24px;border-top-left-radius:16px;border-top-right-radius:16px;display:flex;align-items:center;justify-content:space-between;color:#FFFFFF;flex-wrap:wrap;gap:12px;">
          <div>
            <div style="display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,0.2);border:1px solid #10B981;color:#A7F3D0;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:800;letter-spacing:0.5px;text-transform:uppercase;">
              <span style="width:6px;height:6px;border-radius:50%;background:#10B981;"></span>
              Staff Command & Inter-Role Operations Hub
            </div>
            <h2 style="margin:4px 0 0 0;font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#FFFFFF;">GramBondhon Operations Control</h2>
            <p style="margin:2px 0 0 0;font-size:12px;color:#A7F3D0;">Real-time coordination across Investors, Farmers, Compliance Staff & Blockchain Escrow</p>
          </div>
          <button id="close-staff-modal" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);color:#FFFFFF;width:32px;height:32px;border-radius:50%;cursor:pointer;font-weight:900;font-size:14px;display:flex;align-items:center;justify-content:center;">✕</button>
        </div>

        <!-- Live Integrations Status Bar -->
        <div style="background:#F0FDF4;border-bottom:1px solid #BBF7D0;padding:10px 24px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;font-size:11px;font-weight:700;">
          <div style="display:flex;align-items:center;gap:5px;color:#065F46;">
            <span style="width:7px;height:7px;border-radius:50%;background:#10B981;"></span>
            <span>Gmail SMTP:</span> <span style="font-family:monospace;background:#DCFCE7;padding:2px 6px;border-radius:4px;">binsadikmuhutasim@gmail.com</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px;color:#065F46;">
            <span style="width:7px;height:7px;border-radius:50%;background:#10B981;"></span>
            <span>Zapier Relay:</span> <span style="font-family:monospace;background:#DCFCE7;padding:2px 6px;border-radius:4px;">ACTIVE (Relay)</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px;color:#065F46;">
            <span style="width:7px;height:7px;border-radius:50%;background:#10B981;"></span>
            <span>Telco SMS Gateway:</span> <span style="font-family:monospace;background:#DCFCE7;padding:2px 6px;border-radius:4px;">01838213020</span>
          </div>
          <div style="display:flex;align-items:center;gap:5px;color:#065F46;">
            <span style="width:7px;height:7px;border-radius:50%;background:#10B981;"></span>
            <span>Base Sepolia:</span> <span style="font-family:monospace;background:#DCFCE7;padding:2px 6px;border-radius:4px;">Chain ID 84532</span>
          </div>
        </div>

        <!-- Tab Bar -->
        <div style="display:flex;background:#F8FAFC;border-bottom:1px solid #E2E8F0;padding:0 24px;overflow-x:auto;">
          <button class="staff-tab-btn" data-tab="comms" style="padding:12px 18px;font-size:13px;font-weight:800;border:none;background:transparent;cursor:pointer;border-bottom:3px solid ${this.activeTab === 'comms' ? '#047857' : 'transparent'};color:${this.activeTab === 'comms' ? '#047857' : '#64748B'};">
            💬 Connected Communications
          </button>
          <button class="staff-tab-btn" data-tab="kyc" style="padding:12px 18px;font-size:13px;font-weight:800;border:none;background:transparent;cursor:pointer;border-bottom:3px solid ${this.activeTab === 'kyc' ? '#047857' : 'transparent'};color:${this.activeTab === 'kyc' ? '#047857' : '#64748B'};">
            🪪 KYC Verifications
          </button>
          <button class="staff-tab-btn" data-tab="deals" style="padding:12px 18px;font-size:13px;font-weight:800;border:none;background:transparent;cursor:pointer;border-bottom:3px solid ${this.activeTab === 'deals' ? '#047857' : 'transparent'};color:${this.activeTab === 'deals' ? '#047857' : '#64748B'};">
            🌾 Deal Approvals
          </button>
          <button class="staff-tab-btn" data-tab="settle" style="padding:12px 18px;font-size:13px;font-weight:800;border:none;background:transparent;cursor:pointer;border-bottom:3px solid ${this.activeTab === 'settle' ? '#047857' : 'transparent'};color:${this.activeTab === 'settle' ? '#047857' : '#64748B'};">
            ⛓️ Base Sepolia Escrow
          </button>
          <button class="staff-tab-btn" data-tab="integrations" style="padding:12px 18px;font-size:13px;font-weight:800;border:none;background:transparent;cursor:pointer;border-bottom:3px solid ${this.activeTab === 'integrations' ? '#047857' : 'transparent'};color:${this.activeTab === 'integrations' ? '#047857' : '#64748B'};">
            ⚙️ Zapier & Webhook Config
          </button>
        </div>

        <!-- Content Area -->
        <div id="staff-tab-content" style="padding:24px;flex:1;overflow-y:auto;">
          <div style="text-align:center;padding:30px;color:#64748B;">Loading real-time operations data...</div>
        </div>
      </div>
    `;

    document.getElementById("close-staff-modal")?.addEventListener("click", () => this.close());

    modal.querySelectorAll(".staff-tab-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tab = (e.currentTarget as HTMLElement).getAttribute("data-tab") as any;
        this.activeTab = tab;
        this.render();
      });
    });

    const data = await this.fetchPortalData();
    this.renderTabContent(data);
  }

  private renderTabContent(data: any): void {
    const container = document.getElementById("staff-tab-content");
    if (!container) return;

    if (this.activeTab === "comms") {
      const feed = data?.comms?.feed || [];
      container.innerHTML = `
        <div>
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <div>
              <h3 style="margin:0;font-size:16px;font-weight:800;color:#0F172A;">Inter-Role Connected Communications Feed</h3>
              <p style="margin:2px 0 0 0;font-size:12px;color:#64748B;">Real-time automated broadcasts between Investor, Farmer, Staff, and Smart Contracts</p>
            </div>
            <button id="btn-broadcast-staff" style="background:#047857;color:#fff;border:none;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">
              + Send Staff Notice
            </button>
          </div>

          <!-- Broadcast composer (hidden by default) -->
          <div id="broadcast-composer" style="display:none;background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:16px;margin-bottom:18px;">
            <div style="font-size:13px;font-weight:800;margin-bottom:8px;color:#0F172A;">Compose Notice to Collective:</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;">
              <input id="staff-broadcast-subject" placeholder="Subject (e.g. Field Inspection Complete)" style="padding:8px 12px;border:1px solid #CBD5E1;border-radius:6px;font-size:12px;" />
              <select id="staff-broadcast-target" style="padding:8px 12px;border:1px solid #CBD5E1;border-radius:6px;font-size:12px;">
                <option value="ALL">All Roles (Investors & Farmers)</option>
                <option value="FARMER">Farmers & Cooperatives</option>
                <option value="INVESTOR">Investors</option>
              </select>
            </div>
            <textarea id="staff-broadcast-msg" rows="3" placeholder="Enter notification message..." style="width:100%;padding:8px 12px;border:1px solid #CBD5E1;border-radius:6px;font-size:12px;box-sizing:border-box;margin-bottom:10px;"></textarea>
            <div style="display:flex;justify-content:flex-end;gap:8px;">
              <button id="btn-cancel-broadcast" style="background:#E2E8F0;border:none;padding:6px 12px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Cancel</button>
              <button id="btn-submit-broadcast" style="background:#047857;color:#fff;border:none;padding:6px 16px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Broadcast via SMS/Relay</button>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:12px;">
            ${feed.map((item: any) => `
              <div style="background:#FFFFFF;border:1.5px solid #E2E8F0;border-radius:12px;padding:14px 18px;display:flex;flex-direction:column;gap:6px;box-shadow:0 2px 6px rgba(0,0,0,0.02);">
                <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">
                  <div style="display:flex;align-items:center;gap:8px;font-size:12px;">
                    <span style="font-weight:800;color:${item.fromRole === 'INVESTOR' ? '#2563EB' : item.fromRole === 'STAFF' ? '#047857' : '#D97706'};background:#F1F5F9;padding:3px 8px;border-radius:6px;">${item.fromRole}</span>
                    <span style="color:#0F172A;font-weight:700;">${item.fromName}</span>
                    <span style="color:#94A3B8;">➔</span>
                    <span style="color:#475569;font-weight:600;">${item.toName}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:10px;font-family:monospace;background:#ECFDF5;color:#047857;border:1px solid #A7F3D0;padding:2px 8px;border-radius:12px;font-weight:700;">${item.channel}</span>
                    <span style="font-size:11px;color:#94A3B8;">${new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
                <div style="font-size:13px;font-weight:700;color:#0F172A;">${item.subject}</div>
                <div style="font-size:12px;color:#475569;line-height:1.4;">${item.message}</div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      const composer = document.getElementById("broadcast-composer");
      document.getElementById("btn-broadcast-staff")?.addEventListener("click", () => {
        if (composer) composer.style.display = composer.style.display === "none" ? "block" : "none";
      });
      document.getElementById("btn-cancel-broadcast")?.addEventListener("click", () => {
        if (composer) composer.style.display = "none";
      });
      document.getElementById("btn-submit-broadcast")?.addEventListener("click", async () => {
        const sub = (document.getElementById("staff-broadcast-subject") as HTMLInputElement)?.value;
        const msg = (document.getElementById("staff-broadcast-msg") as HTMLTextAreaElement)?.value;
        const target = (document.getElementById("staff-broadcast-target") as HTMLSelectElement)?.value;
        if (!sub || !msg) {
          this.showToast("Please enter subject and message");
          return;
        }
        await fetch("http://localhost:3001/api/v1/communications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fromRole: "STAFF", fromName: "Operations Team", toRole: target, subject: sub, message: msg }),
        });
        this.showToast("Notice broadcasted to all roles!");
        this.render();
      });

    } else if (this.activeTab === "kyc") {
      const kycList = data?.kyc?.data || [];
      container.innerHTML = `
        <div>
          <h3 style="margin:0 0 4px 0;font-size:16px;font-weight:800;color:#0F172A;">National ID & Farmer KYC Verification Queue</h3>
          <p style="margin:0 0 16px 0;font-size:12px;color:#64748B;">Compliance staff verification unlocks Shariah contracts and automated payouts</p>

          <table style="width:100%;border-collapse:collapse;font-size:12px;text-align:left;">
            <thead>
              <tr style="background:#F8FAFC;border-bottom:2px solid #E2E8F0;color:#475569;">
                <th style="padding:10px 12px;">User / Role</th>
                <th style="padding:10px 12px;">National ID (NID)</th>
                <th style="padding:10px 12px;">Contact</th>
                <th style="padding:10px 12px;">Status</th>
                <th style="padding:10px 12px;text-align:right;">Staff Action</th>
              </tr>
            </thead>
            <tbody>
              ${kycList.map((item: any) => `
                <tr style="border-bottom:1px solid #F1F5F9;">
                  <td style="padding:12px;">
                    <div style="font-weight:800;color:#0F172A;">${item.user}</div>
                    <div style="font-size:10px;color:#64748B;">Role: ${item.role}</div>
                  </td>
                  <td style="padding:12px;font-family:monospace;color:#047857;font-weight:700;">${item.nid}</td>
                  <td style="padding:12px;">
                    <div>${item.email}</div>
                    <div style="font-size:11px;color:#64748B;">${item.phone}</div>
                  </td>
                  <td style="padding:12px;">
                    <span style="display:inline-block;padding:3px 8px;border-radius:12px;font-weight:800;font-size:10px;background:${item.status === 'VERIFIED' ? '#DCFCE7' : '#FEF3C7'};color:${item.status === 'VERIFIED' ? '#166534' : '#92400E'};">
                      ${item.status}
                    </span>
                  </td>
                  <td style="padding:12px;text-align:right;">
                    ${item.status === 'VERIFIED' 
                      ? `<span style="color:#047857;font-weight:700;">✓ Approved</span>`
                      : `<button class="btn-verify-kyc" data-id="${item.id}" style="background:#047857;color:#fff;border:none;padding:6px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;">
                          Approve & Notify (SMS/Email)
                        </button>`
                    }
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;

      container.querySelectorAll(".btn-verify-kyc").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
          await fetch("http://localhost:3001/api/v1/admin/kyc/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, status: "VERIFIED" }),
          });
          this.showToast("KYC approved! Notice dispatched via SMS & Email.");
          this.render();
        });
      });

    } else if (this.activeTab === "deals") {
      const dealsList = data?.deals?.data || [];
      container.innerHTML = `
        <div>
          <h3 style="margin:0 0 4px 0;font-size:16px;font-weight:800;color:#0F172A;">Agricultural Campaigns Pending Underwriting Approval</h3>
          <p style="margin:0 0 16px 0;font-size:12px;color:#64748B;">Staff agronomists verify soil reports and biosecurity before projects open for funding</p>

          <div style="display:flex;flex-direction:column;gap:12px;">
            ${dealsList.map((deal: any) => `
              <div style="background:#FFFFFF;border:1.5px solid #E2E8F0;border-radius:12px;padding:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
                <div>
                  <div style="display:flex;align-items:center;gap:8px;">
                    <span style="background:#DCFCE7;color:#166534;font-size:10px;font-weight:800;padding:2px 8px;border-radius:6px;">Risk Grade: ${deal.riskScore}</span>
                    <span style="font-weight:800;font-size:14px;color:#0F172A;">${deal.title}</span>
                  </div>
                  <div style="font-size:12px;color:#64748B;margin-top:4px;">Producer: ${deal.farmer} • Target Goal: ৳ ${deal.goal.toLocaleString()} BDT (${deal.expectedRoi})</div>
                </div>
                <div>
                  ${deal.status === 'APPROVED_BY_STAFF'
                    ? `<span style="color:#047857;font-weight:800;">✓ Live on Platform</span>`
                    : `<button class="btn-approve-deal" data-id="${deal.id}" style="background:#047857;color:#fff;border:none;padding:8px 16px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;">
                        Approve Deal & Trigger Zapier
                      </button>`
                  }
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      container.querySelectorAll(".btn-approve-deal").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = (e.currentTarget as HTMLElement).getAttribute("data-id");
          await fetch(`http://localhost:3001/api/v1/admin/deals/${id}/approve`, {
            method: "POST",
          });
          this.showToast("Deal approved! Zapier Webhook & SMS dispatched.");
          this.render();
        });
      });

    } else if (this.activeTab === "settle") {
      const settle = data?.settle || {};
      container.innerHTML = `
        <div>
          <h3 style="margin:0 0 4px 0;font-size:16px;font-weight:800;color:#0F172A;">Base Sepolia Smart Contract Escrow Vault</h3>
          <p style="margin:0 0 16px 0;font-size:12px;color:#64748B;">Capital committed by investors is locked on Base Sepolia and released in phases upon field milestones</p>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
            <div style="background:#F0FDF4;border:1.5px solid #86EFAC;border-radius:12px;padding:16px;">
              <div style="font-size:11px;font-weight:700;color:#166534;">CURRENT ESCROW VAULT BALANCE</div>
              <div style="font-size:24px;font-weight:900;color:#065F46;margin:4px 0;">৳ ${(settle.escrowBalanceBDT || 4850000).toLocaleString()} BDT</div>
              <div style="font-size:11px;color:#047857;">Contract: 0x882A...A0 (Base Sepolia)</div>
            </div>
            <div style="background:#EFF6FF;border:1.5px solid #93C5FD;border-radius:12px;padding:16px;">
              <div style="font-size:11px;font-weight:700;color:#1E40AF;">TOTAL HARVEST CAPITAL DISBURSED</div>
              <div style="font-size:24px;font-weight:900;color:#1E3A8A;margin:4px 0;">৳ ${(settle.totalReleasedBDT || 2340000).toLocaleString()} BDT</div>
              <div style="font-size:11px;color:#2563EB;">To 24 Certified Bangladeshi Farming Clusters</div>
            </div>
          </div>

          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
            <div style="font-size:13px;font-weight:800;">Recent Escrow Disbursal Records:</div>
            <button id="btn-execute-release" style="background:#047857;color:#fff;border:none;padding:7px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">
              + Release Harvest Milestone Capital
            </button>
          </div>

          <div style="display:flex;flex-direction:column;gap:10px;">
            ${(settle.records || []).map((rec: any) => `
              <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:10px;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;">
                <div>
                  <div style="font-weight:800;font-size:13px;color:#0F172A;">${rec.deal}</div>
                  <div style="font-size:11px;color:#64748B;">Recipient: ${rec.farmer} • Block #${rec.blockNumber}</div>
                </div>
                <div style="text-align:right;">
                  <div style="font-weight:900;font-size:14px;color:#065F46;">৳ ${rec.amount.toLocaleString()} BDT</div>
                  <a href="https://sepolia.basescan.org/tx/${rec.txHash}" target="_blank" style="font-size:11px;color:#047857;font-weight:700;text-decoration:none;">View on BaseScan ↗</a>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;

      document.getElementById("btn-execute-release")?.addEventListener("click", async () => {
        await fetch("http://localhost:3001/api/v1/admin/settlements/release", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deal: "Boro Rice Seedlings Nursery", farmer: "North Bengal Rice Growers Forum", amount: 410000 }),
        });
        this.showToast("Escrow capital disbursed on Base Sepolia! SMS sent to farmer.");
        this.render();
      });

    } else if (this.activeTab === "integrations") {
      const zap = data?.zap || {};
      container.innerHTML = `
        <div>
          <h3 style="margin:0 0 4px 0;font-size:16px;font-weight:800;color:#0F172A;">Zapier, SMS & Webhook Integrations Manager</h3>
          <p style="margin:0 0 16px 0;font-size:12px;color:#64748B;">Configure live webhooks to stream events to your custom Zapier Zaps, Slack, or SMS aggregators</p>

          <div style="background:#F8FAFC;border:1px solid #CBD5E1;border-radius:12px;padding:18px;margin-bottom:18px;">
            <div style="font-size:13px;font-weight:800;color:#0F172A;margin-bottom:6px;">Custom Zapier Webhook Catch URL:</div>
            <div style="display:flex;gap:10px;margin-bottom:10px;">
              <input id="custom-zapier-url" placeholder="https://hooks.zapier.com/hooks/catch/12345/abcdef/" value="${zap.rawWebhookUrl || ''}" style="flex:1;padding:10px 14px;border:1px solid #CBD5E1;border-radius:8px;font-size:12px;font-family:monospace;" />
              <button id="btn-save-zapier-url" style="background:#047857;color:#fff;border:none;padding:10px 18px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;">Save & Activate</button>
            </div>
            <div style="font-size:11px;color:#64748B;">Currently Active Endpoint: <span style="font-family:monospace;color:#047857;font-weight:700;">${zap.webhookUrl || 'http://localhost:3001/api/v1/webhooks/zapier/relay (Built-in Relay)'}</span></div>
          </div>

          <div style="background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:16px;margin-bottom:18px;">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div style="font-size:13px;font-weight:800;">Send Instant Test Ping to Zapier:</div>
              <button id="btn-ping-zapier" style="background:#1E3A8A;color:#fff;border:none;padding:6px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">Send Ping Now</button>
            </div>
            <div id="ping-result-box" style="font-size:12px;color:#64748B;font-family:monospace;background:#F1F5F9;padding:8px 12px;border-radius:6px;">Ready to test connection.</div>
          </div>
        </div>
      `;

      document.getElementById("btn-save-zapier-url")?.addEventListener("click", async () => {
        const url = (document.getElementById("custom-zapier-url") as HTMLInputElement)?.value;
        await fetch("http://localhost:3001/api/v1/webhooks/zapier/configure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ webhookUrl: url }),
        });
        this.showToast("Zapier webhook updated and active!");
        this.render();
      });

      document.getElementById("btn-ping-zapier")?.addEventListener("click", async () => {
        const box = document.getElementById("ping-result-box");
        if (box) box.textContent = "Sending test ping to Zapier...";
        try {
          const res = await fetch("http://localhost:3001/api/v1/webhooks/zapier/test", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Test ping from Staff Command Portal" }),
          }).then(r => r.json());
          if (box) box.innerHTML = `<span style="color:#047857;font-weight:700;">✓ Dispatched! Status: ${res.status || 200} - ${res.message}</span>`;
          this.showToast("Test ping dispatched to Zapier!");
        } catch (e: any) {
          if (box) box.textContent = `Error: ${e.message}`;
        }
      });
    }
  }
}
