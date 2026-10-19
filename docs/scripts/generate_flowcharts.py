import matplotlib.pyplot as plt
import matplotlib.patches as patches
import os

# Set font that supports Thai if available, or clean sans-serif
plt.rcParams['font.sans-serif'] = ['Tahoma', 'Microsoft Sans Serif', 'Arial Unicode MS', 'DejaVu Sans', 'sans-serif']
plt.rcParams['axes.unicode_minus'] = False

def create_flowchart_website():
    fig, ax = plt.subplots(figsize=(12, 8), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')

    # Background
    fig.patch.set_facecolor('#ffffff')

    # Title
    ax.text(50, 96, 'System Architecture & Data Flow: Belton 3D Digital Twin Platform', 
            fontsize=15, fontweight='bold', ha='center', va='center', color='#0f172a')
    ax.text(50, 93, 'แผนภาพสถาปัตยกรรมการทำงานของระบบเว็บไซต์และ 3D Digital Twin', 
            fontsize=12, ha='center', va='center', color='#475569')

    # Box styles
    def draw_box(x, y, w, h, title, subtitle, box_color, border_color, title_color='#ffffff'):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=1.2,rounding_size=2",
                                      facecolor=box_color, edgecolor=border_color, linewidth=2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2 + 2, title, fontsize=10, fontweight='bold', ha='center', va='center', color=title_color)
        ax.text(x + w/2, y + h/2 - 3, subtitle, fontsize=8.5, ha='center', va='center', color=title_color)

    def draw_arrow(x1, y1, x2, y2, label=''):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(facecolor='#0284c7', edgecolor='#0284c7', width=2, headwidth=8, headlength=8))
        if label:
            ax.text((x1+x2)/2, (y1+y2)/2 + 2, label, fontsize=8, ha='center', va='center', color='#0369a1', fontweight='bold')

    # 1. User Layer (Top Left)
    draw_box(5, 72, 26, 14, 'User Client (Web Browser)', 'Google Chrome / Edge (HTML5/Canvas)', '#1e293b', '#334155')

    # 2. UI / View Layer (Middle Left)
    draw_box(37, 72, 26, 14, 'Presentation & Interaction Layer', 'VisionOS Glass Navbar & Scandinavian UI', '#0284c7', '#0369a1')

    # 3. 3D Engine Layer (Middle Right)
    draw_box(69, 72, 26, 14, 'Three.js 3D WebGL Engine', 'PBR Shading, OrbitControls & Cutaway', '#059669', '#047857')

    # 4. Web Application Server (Middle Row)
    draw_box(37, 44, 26, 14, 'Backend Web Server', 'Node.js & Express REST API / SSE', '#4338ca', '#3730a3')

    # 5. 3D Assets (Bottom Right)
    draw_box(69, 44, 26, 14, '3D Spatial Assets (Blender)', '12 Cleanroom Zones + HDD GLTF Models', '#d97706', '#b45309')

    # 6. Database Layer (Bottom Center)
    draw_box(37, 16, 26, 14, 'SCADA Telemetry Database', 'SQLite3 (50 ACA Machines Real-time)', '#dc2626', '#b91c1c')

    # 7. AI Copilot Integration (Bottom Left)
    draw_box(5, 44, 26, 14, 'AI Engineering Copilot', 'Conversational AI / Auto Camera Teleport', '#7c3aed', '#6d28d9')

    # Connectors
    draw_arrow(31, 79, 37, 79, 'HTTP / UI Events')
    draw_arrow(63, 79, 69, 79, 'WebGL Canvas')
    draw_arrow(50, 72, 50, 58, 'API Requests')
    draw_arrow(69, 51, 63, 51, 'Assets Fetch')
    draw_arrow(82, 58, 82, 72, 'GLTF Stream')
    draw_arrow(50, 44, 50, 30, 'SQL Query')
    draw_arrow(37, 51, 31, 51, 'SSE Stream')
    draw_arrow(18, 58, 18, 72, 'Assistant Chat')
    draw_arrow(31, 47, 69, 75, 'Autonomous 3D Teleport Action')

    # Save
    out_img = os.path.abspath('scratch/flowchart_website_digital_twin.png')
    plt.tight_layout()
    plt.savefig(out_img, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"Website flowchart created at: {out_img}")

def create_flowchart_ai():
    fig, ax = plt.subplots(figsize=(12, 10), dpi=300)
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis('off')
    fig.patch.set_facecolor('#ffffff')

    ax.text(50, 97, 'AI Copilot & Agentic RAG Workflow Architecture', 
            fontsize=15, fontweight='bold', ha='center', va='center', color='#0f172a')
    ax.text(50, 94, 'แผนภาพกระบวนการทำงานของปัญญาประดิษฐ์ Belton AI Copilot และระบบ RAG', 
            fontsize=12, ha='center', va='center', color='#475569')

    def draw_box(x, y, w, h, title, subtitle, box_color, border_color, title_color='#ffffff'):
        rect = patches.FancyBboxPatch((x, y), w, h, boxstyle="round,pad=1.2,rounding_size=2",
                                      facecolor=box_color, edgecolor=border_color, linewidth=2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2 + 2, title, fontsize=9.5, fontweight='bold', ha='center', va='center', color=title_color)
        ax.text(x + w/2, y + h/2 - 3, subtitle, fontsize=8, ha='center', va='center', color=title_color)

    def draw_diamond(x, y, w, h, text1, text2, box_color, border_color):
        diamond = patches.Polygon([[x + w/2, y], [x + w, y + h/2], [x + w/2, y + h], [x, y + h/2]],
                                  closed=True, facecolor=box_color, edgecolor=border_color, linewidth=2)
        ax.add_patch(diamond)
        ax.text(x + w/2, y + h/2 + 1.5, text1, fontsize=9, fontweight='bold', ha='center', va='center', color='#ffffff')
        ax.text(x + w/2, y + h/2 - 2.5, text2, fontsize=8, ha='center', va='center', color='#ffffff')

    def draw_arrow(x1, y1, x2, y2, label=''):
        ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(facecolor='#2563eb', edgecolor='#2563eb', width=2, headwidth=7, headlength=7))
        if label:
            ax.text((x1+x2)/2 + 2, (y1+y2)/2, label, fontsize=8, ha='left', va='center', color='#1d4ed8', fontweight='bold')

    # Step 1: User input
    draw_box(37, 83, 26, 8, '1. User Chat Query', 'ผู้ใช้พิมพ์ข้อความคำถามใน Copilot UI', '#1e293b', '#334155')

    # Step 2: Orchestrator Preprocessor
    draw_box(37, 69, 26, 8, '2. Context Preprocessor', 'วิเคราะห์เจตนา (Intent) & ตรวจสอบประวัติแชท', '#0284c7', '#0369a1')

    # Step 3: Intent Decision Diamond
    draw_diamond(35, 50, 30, 12, 'Query Type?', 'จำแนกประเภทคำถาม', '#4338ca', '#3730a3')

    # Branch A: Casual / Greetings (Left)
    draw_box(5, 52, 24, 8, 'Casual / Greeting', 'ทักทาย / แนะนำตัวระบบ', '#059669', '#047857')

    # Branch B: Technical RAG (Right)
    draw_box(71, 52, 24, 8, 'Technical Knowledge RAG', 'สืบค้นสไลด์ SOP 460 หน้า + ข้อสอบ', '#d97706', '#b45309')

    # Branch C: Machine Teleport / SCADA (Down)
    draw_box(37, 34, 26, 8, 'Tool Execution', 'ดึงข้อมูล SCADA หรือวาร์ปกล้อง 3D', '#7c3aed', '#6d28d9')

    # Step 4: Ollama Service Status Check
    draw_diamond(35, 17, 30, 11, 'Ollama Active?', 'ตรวจสอบสถานะ Ollama Service', '#0f766e', '#115e59')

    # Branch Offline Fail-Safe (Left)
    draw_box(5, 18, 24, 8, 'Graceful Offline Response', 'พิมพ์: "กรุณาติดต่อผู้เปิดเซิฟเวอร์"', '#dc2626', '#b91c1c')

    # Branch Online Synthesis (Right)
    draw_box(71, 18, 24, 8, 'Qwen 2.5:14b LLM (GPU)', 'ประมวลผลคำตอบภาษาไทยความแม่นยำสูง', '#16a34a', '#15803d')

    # Step 5: Final Output Stream (Bottom)
    draw_box(37, 2, 26, 8, 'Server-Sent Events (SSE)', 'สตรีมพิมพ์ข้อความทีละตัวอักษรสู่หน้าจอ', '#1e293b', '#334155')

    # Connectors
    draw_arrow(50, 83, 50, 77)
    draw_arrow(50, 69, 50, 62)
    draw_arrow(35, 56, 29, 56, 'ทักทาย')
    draw_arrow(65, 56, 71, 56, 'ถามสเปก/ข้อสอบ')
    draw_arrow(50, 50, 50, 42, 'ถามเครื่อง/วาร์ป')

    draw_arrow(17, 52, 40, 26)
    draw_arrow(50, 34, 50, 28)
    draw_arrow(83, 52, 60, 26)

    draw_arrow(35, 22.5, 29, 22.5, 'ไม่พร้อม/ปิดอยู่')
    draw_arrow(65, 22.5, 71, 22.5, 'พร้อมทำงาน (Online)')

    draw_arrow(17, 18, 40, 8)
    draw_arrow(83, 18, 60, 8)

    out_img = os.path.abspath('scratch/flowchart_ai_copilot_rag.png')
    plt.tight_layout()
    plt.savefig(out_img, dpi=300, facecolor=fig.get_facecolor(), edgecolor='none')
    plt.close()
    print(f"AI flowchart created at: {out_img}")

if __name__ == '__main__':
    create_flowchart_website()
    create_flowchart_ai()

