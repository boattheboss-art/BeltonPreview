"""
=============================================================================
HDD Actuator & Head Stack Assembly - Blender Python Generator Script (bpy)
=============================================================================
วิธีใช้งานใน Blender:
1. เปิดโปรแกรม Blender
2. ไปที่แท็บ 'Scripting' ด้านบน
3. กดปุ่ม '+ New' เพื่อสร้างสคริปต์ใหม่
4. วางโค้ดทั้งหมดนี้ลงไป
5. กดปุ่ม 'Run Script' (ไอคอนรูป Play หรือกด Alt + P)
=============================================================================
"""

import bpy
import bmesh
import math
from mathutils import Vector, Matrix

# =============================================================================
# 1. SETUP & UTILS (ไม่มีการเคลียร์ซีนเดิม)
# =============================================================================

def get_or_create_collection(name, parent_col=None):
    """สร้างหรือดึง Collection เพื่อจัดหมวดหมู่ชิ้นส่วนให้อย่างเป็นระเบียบ"""
    if name in bpy.data.collections:
        col = bpy.data.collections[name]
    else:
        col = bpy.data.collections.new(name)
        if parent_col:
            parent_col.children.link(col)
        else:
            bpy.context.scene.collection.children.link(col)
    return col

def create_material(name, color=(0.8, 0.8, 0.8, 1.0), metallic=0.9, roughness=0.2, transmission=0.0):
    """สร้าง Shader Material แบบ PBR (Principled BSDF)"""
    mat = bpy.data.materials.get(name)
    if mat is None:
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        nodes = mat.node_tree.nodes
        bsdf = nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs['Base Color'].default_value = color
            bsdf.inputs['Metallic'].default_value = metallic
            bsdf.inputs['Roughness'].default_value = roughness
            if 'Transmission' in bsdf.inputs:
                bsdf.inputs['Transmission'].default_value = transmission
            elif 'Transmission Weight' in bsdf.inputs:
                bsdf.inputs['Transmission Weight'].default_value = transmission
    return mat

# =============================================================================
# 2. CREATE PBR MATERIALS
# =============================================================================

materials = {
    'aluminum': create_material('MAT_CNC_Duralumin', (0.85, 0.84, 0.82, 1.0), metallic=0.85, roughness=0.22),
    'cavity': create_material('MAT_Milled_Cavity', (0.70, 0.69, 0.65, 1.0), metallic=0.75, roughness=0.38),
    'pivot_ring': create_material('MAT_Stainless_Steel', (0.92, 0.90, 0.88, 1.0), metallic=0.95, roughness=0.12),
    'pivot_well': create_material('MAT_Pivot_Well', (0.85, 0.80, 0.60, 1.0), metallic=0.65, roughness=0.28),
    'gold_bezel': create_material('MAT_Gold_Anodized', (0.95, 0.75, 0.25, 1.0), metallic=0.95, roughness=0.18),
    'vcm_core': create_material('MAT_Dark_Sintered_Core', (0.15, 0.16, 0.18, 1.0), metallic=0.88, roughness=0.35),
    'silver_wing': create_material('MAT_Silver_Wings', (0.80, 0.79, 0.78, 1.0), metallic=0.85, roughness=0.25),
    'fpc_kapton': create_material('MAT_Amber_Kapton_FPC', (0.85, 0.42, 0.12, 1.0), metallic=0.20, roughness=0.25, transmission=0.3),
    'pcb_glossy': create_material('MAT_PCB_Glossy', (0.82, 0.45, 0.15, 1.0), metallic=0.25, roughness=0.20),
    'black_plastic': create_material('MAT_Black_Plastic', (0.08, 0.09, 0.10, 1.0), metallic=0.30, roughness=0.45),
    'gold_pins': create_material('MAT_Gold_Pins', (0.96, 0.82, 0.35, 1.0), metallic=0.95, roughness=0.10),
    'silver_washer': create_material('MAT_Silver_Washer', (0.88, 0.89, 0.92, 1.0), metallic=0.96, roughness=0.15),
}

# =============================================================================
# 3. PROCEDURAL BUILDERS FOR EACH 3D MODULE
# =============================================================================

main_col = get_or_create_collection("HDD_Actuator_Assembly")

# -----------------------------------------------------------------------------
# Module 1: Actuator E-Block Comb (8 Tiers)
# -----------------------------------------------------------------------------
def build_arm_stack(col):
    arm_col = get_or_create_collection("01_Arm_Stack", col)
    num_tiers = 8
    tier_gap = 0.19

    # สร้างรูปทรง 2D Blade Profile
    blade_pts = [
        (0.0, 0.0), (-1.6, 0.42), (-2.6, 0.56), (-3.4, 0.46),
        (-4.0, 0.2), (-4.15, 0.0), (-4.0, -0.2), (-3.4, -0.36),
        (-2.6, -0.40), (-1.6, -0.28), (0.0, -0.6)
    ]

    for i in range(num_tiers):
        z_offset = (i - (num_tiers - 1) / 2) * tier_gap
        
        # Mesh Blade
        bm = bmesh.new()
        verts = [bm.verts.new((x, y, 0)) for x, y in blade_pts]
        bm.faces.new(verts)
        bmesh.ops.triangle_fill(bm, use_beauty=True, edges=bm.edges)
        
        # Extrude 3D Thickness
        geom = bmesh.ops.extrude_face_region(bm, geom=bm.faces)
        for v in [g for g in geom['geom'] if isinstance(g, bmesh.types.BMVert)]:
            v.co.z += 0.065
            
        mesh = bpy.data.meshes.new(f"Arm_Blade_Tier_{i+1}")
        bm.to_mesh(mesh)
        bm.free()
        
        obj = bpy.data.objects.new(f"Arm_Blade_Tier_{i+1}", mesh)
        obj.location = (0, 0, z_offset)
        obj.data.materials.append(materials['aluminum'])
        arm_col.objects.link(obj)
        
        # Add Bevel Modifier for realism
        bev = obj.modifiers.new("Bevel", 'BEVEL')
        bev.width = 0.012
        bev.segments = 2

        # Top tier: Milled Pocket & Rivets
        if i == num_tiers - 1:
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-2.2, 0.08, z_offset + 0.05))
            pocket = bpy.context.active_object
            pocket.name = "Recessed_Cavity"
            pocket.scale = (1.2, 0.32, 0.04)
            pocket.data.materials.append(materials['cavity'])
            arm_col.objects.link(pocket)
            bpy.context.collection.objects.unlink(pocket)

            for idx, r_y in enumerate([0.12, -0.02]):
                bpy.ops.mesh.primitive_cylinder_add(radius=0.06, depth=0.06, location=(-3.2, r_y, z_offset + 0.06))
                rivet = bpy.context.active_object
                rivet.name = f"Rivet_{idx+1}"
                rivet.data.materials.append(materials['silver_washer'])
                arm_col.objects.link(rivet)
                bpy.context.collection.objects.unlink(rivet)

        # Suspension Tip
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-4.22, 0.0, z_offset + 0.03))
        tip = bpy.context.active_object
        tip.name = f"Suspension_Mount_{i+1}"
        tip.scale = (0.25, 0.08, 0.015)
        tip.data.materials.append(materials['silver_washer'])
        arm_col.objects.link(tip)
        bpy.context.collection.objects.unlink(tip)

    # Extended Side Trace Flex Stiffener Pad
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-0.95, 0.54, 0.0))
    side_pad = bpy.context.active_object
    side_pad.name = "Comb_Side_Trace_Pad"
    side_pad.scale = (1.4, 0.22, num_tiers * tier_gap + 0.12)
    side_pad.rotation_euler = (0, 0, -math.pi * 0.08)
    side_pad.data.materials.append(materials['fpc_kapton'])
    arm_col.objects.link(side_pad)
    bpy.context.collection.objects.unlink(side_pad)

# -----------------------------------------------------------------------------
# Module 2: Pivot Bearing Hub & 3-Aperture Cluster
# -----------------------------------------------------------------------------
def build_pivot_bearing(col):
    piv_col = get_or_create_collection("02_Pivot_Bearing", col)

    # Outer Chamfered Rim
    bpy.ops.mesh.primitive_cylinder_add(radius=0.82, depth=1.6, vertices=48, location=(0, 0, 0))
    rim = bpy.context.active_object
    rim.name = "Pivot_Outer_Ring"
    rim.data.materials.append(materials['pivot_ring'])
    piv_col.objects.link(rim)
    bpy.context.collection.objects.unlink(rim)

    # Deep Turning Well
    bpy.ops.mesh.primitive_cylinder_add(radius=0.64, depth=1.65, vertices=48, location=(0, 0, 0.05))
    well = bpy.context.active_object
    well.name = "Pivot_Concentric_Well"
    well.data.materials.append(materials['pivot_well'])
    piv_col.objects.link(well)
    bpy.context.collection.objects.unlink(well)

    # Center Pin
    bpy.ops.mesh.primitive_cylinder_add(radius=0.26, depth=1.72, vertices=32, location=(0, 0, 0.08))
    pin = bpy.context.active_object
    pin.name = "Pivot_Center_Shaft"
    pin.data.materials.append(materials['aluminum'])
    piv_col.objects.link(pin)
    bpy.context.collection.objects.unlink(pin)

    # 3-Aperture Triad Cluster
    triad = [(-0.45, 0.58, 0.13), (-0.22, 0.66, 0.10), (-0.66, 0.46, 0.085)]
    for idx, (hx, hy, hr) in enumerate(triad):
        bpy.ops.mesh.primitive_cylinder_add(radius=hr, depth=1.7, vertices=24, location=(hx, hy, 0))
        h = bpy.context.active_object
        h.name = f"Triad_Balance_Port_{idx+1}"
        h.data.materials.append(materials['black_plastic'])
        piv_col.objects.link(h)
        bpy.context.collection.objects.unlink(h)

# -----------------------------------------------------------------------------
# Module 3: Voice Coil Core (Triangular Plate)
# -----------------------------------------------------------------------------
def build_voice_coil(col):
    vcm_col = get_or_create_collection("03_Voice_Coil", col)

    vcm_pts = [(0.5, -0.4), (2.3, -1.15), (2.7, 0.0), (2.3, 1.15), (0.5, 0.4)]
    
    bm = bmesh.new()
    verts = [bm.verts.new((x + 0.4, y, 0)) for x, y in vcm_pts]
    bm.faces.new(verts)
    bmesh.ops.triangle_fill(bm, use_beauty=True, edges=bm.edges)
    geom = bmesh.ops.extrude_face_region(bm, geom=bm.faces)
    for v in [g for g in geom['geom'] if isinstance(g, bmesh.types.BMVert)]:
        v.co.z += 0.24

    mesh = bpy.data.meshes.new("Voice_Coil_Core_Plate")
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new("Voice_Coil_Core_Plate", mesh)
    obj.data.materials.append(materials['vcm_core'])
    vcm_col.objects.link(obj)

    # Balance holes
    for idx, hy in enumerate([-0.28, 0.28]):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.12, depth=0.35, location=(2.3, hy, 0.12))
        port = bpy.context.active_object
        port.name = f"VCM_Port_{idx+1}"
        port.data.materials.append(materials['black_plastic'])
        vcm_col.objects.link(port)
        bpy.context.collection.objects.unlink(port)

# -----------------------------------------------------------------------------
# Module 4: Gold-Anodized Chamfered VCM Yoke Bezel
# -----------------------------------------------------------------------------
def build_vcm_top_shroud(col):
    shroud_col = get_or_create_collection("04_VCM_Top_Shroud", col)

    # Gold Bezel Plate
    gold_pts = [(0.4, -0.5), (2.4, -1.35), (3.0, 0.0), (2.4, 1.35), (0.4, 0.5)]
    bm = bmesh.new()
    verts = [bm.verts.new((x + 0.4, y, 0)) for x, y in gold_pts]
    bm.faces.new(verts)
    bmesh.ops.triangle_fill(bm, use_beauty=True, edges=bm.edges)
    geom = bmesh.ops.extrude_face_region(bm, geom=bm.faces)
    for v in [g for g in geom['geom'] if isinstance(g, bmesh.types.BMVert)]:
        v.co.z += 0.18

    mesh = bpy.data.meshes.new("Gold_VCM_Bezel")
    bm.to_mesh(mesh)
    bm.free()

    bezel = bpy.data.objects.new("Gold_VCM_Bezel", mesh)
    bezel.location.z = 0.22
    bezel.data.materials.append(materials['gold_bezel'])
    shroud_col.objects.link(bezel)

    # Silver wings
    for idx, (wy, w_rot) in enumerate([(-1.3, -math.pi * 0.2), (1.3, math.pi * 0.2)]):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(2.8, wy, 0.28))
        w = bpy.context.active_object
        w.name = f"Chassis_Wing_{idx+1}"
        w.scale = (0.4, 0.6, 0.12)
        w.rotation_euler = (0, 0, w_rot)
        w.data.materials.append(materials['silver_wing'])
        shroud_col.objects.link(w)
        bpy.context.collection.objects.unlink(w)

# -----------------------------------------------------------------------------
# Module 5: Flexible Printed Circuit (FPC Ribbon)
# -----------------------------------------------------------------------------
def build_flex_ribbon(col):
    flex_col = get_or_create_collection("05_FPC_Ribbon", col)

    curve_data = bpy.data.curves.new('FPC_Ribbon_Curve', type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.resolution_u = 12

    spline = curve_data.splines.new('BEZIER')
    spline.bezier_points.add(3)

    pts = [(0.1, 0.7, 0.05), (0.5, 1.8, -0.1), (1.6, 1.7, -0.05), (2.2, 1.4, 0.0)]
    for i, pt in enumerate(pts):
        bp = spline.bezier_points[i]
        bp.co = pt
        bp.handle_left_type = 'AUTO'
        bp.handle_right_type = 'AUTO'

    curve_obj = bpy.data.objects.new('FPC_Ribbon_Spline', curve_data)
    curve_data.extrude = 0.29
    curve_obj.data.materials.append(materials['fpc_kapton'])
    flex_col.objects.link(curve_obj)

    # Molded Strain Relief Clamp
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(2.15, 1.45, 0.0))
    clamp = bpy.context.active_object
    clamp.name = "FPC_Strain_Relief_Clamp"
    clamp.scale = (0.32, 0.28, 0.72)
    clamp.rotation_euler = (0, 0, -math.pi * 0.15)
    clamp.data.materials.append(materials['black_plastic'])
    flex_col.objects.link(clamp)
    bpy.context.collection.objects.unlink(clamp)

# -----------------------------------------------------------------------------
# Module 6: Flex-Rigid Pre-Amp PCB & 28-Pin Header
# -----------------------------------------------------------------------------
def build_connector_block(col):
    conn_col = get_or_create_collection("06_Connector_PCB", col)

    # PCB Housing Base
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(3.4, 1.2, 0.1))
    pcb = bpy.context.active_object
    pcb.name = "PreAmp_PCB_Housing"
    pcb.scale = (1.8, 1.6, 0.55)
    pcb.data.materials.append(materials['pcb_glossy'])
    conn_col.objects.link(pcb)
    bpy.context.collection.objects.unlink(pcb)

    # Pre-Amp IC Chip
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(3.15, 1.35, 0.39))
    ic = bpy.context.active_object
    ic.name = "PreAmp_IC_SMD_Chip"
    ic.scale = (0.48, 0.48, 0.04)
    ic.data.materials.append(materials['black_plastic'])
    conn_col.objects.link(ic)
    bpy.context.collection.objects.unlink(ic)

    # Silver Grounding Washers
    for idx, (wx, wy) in enumerate([(3.2, 0.95), (4.2, 1.8)]):
        bpy.ops.mesh.primitive_cylinder_add(radius=0.17, depth=0.65, location=(wx, wy, 0.15))
        w = bpy.context.active_object
        w.name = f"PCB_Ground_Washer_{idx+1}"
        w.data.materials.append(materials['silver_washer'])
        conn_col.objects.link(w)
        bpy.context.collection.objects.unlink(w)

    # 28-Pin SMD Header (2x14 Matrix)
    pin_col = get_or_create_collection("28_Pin_Header_Block", conn_col)
    
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=(3.8, 1.35, 0.38))
    base = bpy.context.active_object
    base.name = "Pin_Header_Base"
    base.scale = (1.65, 0.45, 0.18)
    base.rotation_euler = (0, 0, -math.pi * 0.28)
    base.data.materials.append(materials['black_plastic'])
    pin_col.objects.link(base)
    bpy.context.collection.objects.unlink(base)

    # 28 Pins Loop
    rot_m = Matrix.Rotation(-math.pi * 0.28, 4, 'Z')
    for row in range(2):
        for c in range(14):
            local_pos = Vector((-0.68 + c * 0.105, -0.12 + row * 0.18, 0.16))
            world_pos = Vector((3.8, 1.35, 0.38)) + rot_m @ local_pos
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=world_pos)
            pin = bpy.context.active_object
            pin.name = f"Gold_Pin_{row*14 + c + 1}"
            pin.scale = (0.04, 0.04, 0.22)
            pin.rotation_euler = (0, 0, -math.pi * 0.28)
            pin.data.materials.append(materials['gold_pins'])
            pin_col.objects.link(pin)
            bpy.context.collection.objects.unlink(pin)

# =============================================================================
# 4. EXECUTE PIPELINE
# =============================================================================

def run():
    print("--- Generating HDD Actuator Model in Blender ---")
    build_arm_stack(main_col)
    build_pivot_bearing(main_col)
    build_voice_coil(main_col)
    build_vcm_top_shroud(main_col)
    build_flex_ribbon(main_col)
    build_connector_block(main_col)
    print("--- HDD Actuator Assembly Generated Successfully! ---")

if __name__ == "__main__":
    run()

