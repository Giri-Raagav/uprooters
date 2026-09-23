-- ============================================================================
-- UPROOTERS — Migration 002: Canonical Skill Taxonomy & Phase 1 ECE Seed Data
-- Spec references:
--   docs/01_PRODUCT_SPEC.md (§11)
--   docs/04_ARCHITECTURE.md (§52)
--   docs/05_DATABASE_SPEC.md (§19–§22, §76–§78)
--   docs/07_SECURITY_MODEL.md (§17, §24)
--   docs/08_DEVELOPMENT_RULES.md (§11, §30–§33)
--   .agents/rules/uprooters.md (§11)
--
-- Scope:
--   - Canonical skills table (public.skills)
--   - Controlled skill categories check constraint (17 categories per §20)
--   - Hierarchy validation trigger (cycle & self-parenting prevention per §21)
--   - Skill aliases table (public.skill_aliases) with unique normalized_alias
--   - Exact 53 canonical Phase 1 ECE skills seeded idempotently per §78
--   - Canonical parent-child relationships established per §21
--   - High-fidelity aliases seeded without ambiguity or collisions per §22
--   - Row-Level Security (RLS) configured with data_editor & super_admin permissions
-- ============================================================================

-- ── 1. Canonical Skills Table (public.skills) ─────────────────────────────────
-- Spec ref: docs/05_DATABASE_SPEC.md §19, §20
CREATE TABLE IF NOT EXISTS public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(trim(name)) > 0),
  normalized_name TEXT NOT NULL UNIQUE CHECK (char_length(trim(normalized_name)) > 0),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]+$'),
  category VARCHAR(32) NOT NULL CHECK (
    category IN (
      'PROGRAMMING',
      'EMBEDDED',
      'RTOS',
      'MICROCONTROLLERS',
      'VLSI',
      'FPGA',
      'SEMICONDUCTOR',
      'ELECTRONICS',
      'HARDWARE',
      'PCB',
      'COMMUNICATION',
      'RF_WIRELESS',
      'IOT',
      'ROBOTICS',
      'SOFTWARE',
      'TOOLS',
      'OTHER'
    )
  ),
  parent_skill_id UUID REFERENCES public.skills(id) ON DELETE RESTRICT,
  description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_skills_updated_at
  BEFORE UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_skills_slug ON public.skills(slug);
CREATE INDEX IF NOT EXISTS idx_skills_normalized_name ON public.skills(normalized_name);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category);
CREATE INDEX IF NOT EXISTS idx_skills_parent_skill_id ON public.skills(parent_skill_id);

-- ── 2. Hierarchy Cycle & Self-Parenting Protection Trigger ──────────────────
-- Spec ref: docs/05_DATABASE_SPEC.md §21
CREATE OR REPLACE FUNCTION public.check_skill_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_parent UUID;
  depth INT := 0;
  max_depth INT := 20;
BEGIN
  -- Prevent self-parenting
  IF NEW.parent_skill_id IS NOT NULL AND NEW.parent_skill_id = NEW.id THEN
    RAISE EXCEPTION 'Self-parenting is not permitted: skill cannot be its own parent';
  END IF;

  -- Prevent circular hierarchy
  current_parent := NEW.parent_skill_id;
  WHILE current_parent IS NOT NULL LOOP
    IF current_parent = NEW.id THEN
      RAISE EXCEPTION 'Circular skill hierarchy detected';
    END IF;

    depth := depth + 1;
    IF depth > max_depth THEN
      RAISE EXCEPTION 'Skill hierarchy depth exceeds maximum allowed depth (%)', max_depth;
    END IF;

    SELECT parent_skill_id INTO current_parent
    FROM public.skills
    WHERE id = current_parent;
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER check_skills_hierarchy_trigger
  BEFORE INSERT OR UPDATE ON public.skills
  FOR EACH ROW
  EXECUTE FUNCTION public.check_skill_hierarchy();

-- ── 3. Skill Aliases Table (public.skill_aliases) ────────────────────────────
-- Every normalized alias resolves to exactly one canonical skill (unique).
-- Spec ref: docs/05_DATABASE_SPEC.md §22
CREATE TABLE IF NOT EXISTS public.skill_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  alias TEXT NOT NULL CHECK (char_length(trim(alias)) > 0),
  normalized_alias TEXT NOT NULL UNIQUE CHECK (char_length(trim(normalized_alias)) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_skill_aliases_skill_id ON public.skill_aliases(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_aliases_normalized_alias ON public.skill_aliases(normalized_alias);

-- ── 4. Row-Level Security (RLS) Configuration ───────────────────────────────
-- Spec ref: docs/07_SECURITY_MODEL.md §17, §24
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_aliases ENABLE ROW LEVEL SECURITY;

-- 4.1 Policies for public.skills
CREATE POLICY "skills_select_active"
  ON public.skills
  FOR SELECT
  TO authenticated
  USING (status = 'active' OR public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "skills_insert_admin_editor"
  ON public.skills
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "skills_update_admin_editor"
  ON public.skills
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.has_role('data_editor'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "skills_delete_admin"
  ON public.skills
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 4.2 Policies for public.skill_aliases
CREATE POLICY "skill_aliases_select_all"
  ON public.skill_aliases
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "skill_aliases_insert_admin_editor"
  ON public.skill_aliases
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "skill_aliases_update_admin_editor"
  ON public.skill_aliases
  FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.has_role('data_editor'))
  WITH CHECK (public.is_admin() OR public.has_role('data_editor'));

CREATE POLICY "skill_aliases_delete_admin"
  ON public.skill_aliases
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- ── 5. Seed Data: Exact 53 Canonical Phase 1 ECE Skills ──────────────────────
-- Strictly reproduced from docs/05_DATABASE_SPEC.md §78.
-- Seed is idempotent: safely re-executable without generating duplicates.
INSERT INTO public.skills (name, normalized_name, slug, category, description)
VALUES
  ('C', 'c', 'c', 'PROGRAMMING', 'Procedural programming language fundamental to systems, firmware, and embedded development.'),
  ('C++', 'c++', 'cpp', 'PROGRAMMING', 'Object-oriented systems programming language widely used in embedded, DSP, and performance-critical systems.'),
  ('Python', 'python', 'python', 'PROGRAMMING', 'High-level scripting language used for hardware automation, testing, verification, machine learning, and data analysis.'),
  ('Java', 'java', 'java', 'PROGRAMMING', 'Object-oriented programming language utilized in enterprise applications, Android, and middleware.'),
  ('MATLAB', 'matlab', 'matlab', 'TOOLS', 'High-level technical computing environment used for numerical computation, DSP modeling, and simulation.'),
  ('Embedded C', 'embedded c', 'embedded-c', 'EMBEDDED', 'C language extensions and practices targeted at bare-metal and microcontroller development.'),
  ('Embedded Systems', 'embedded systems', 'embedded-systems', 'EMBEDDED', 'Integration of hardware and software designed for dedicated control functions within larger systems.'),
  ('Microcontrollers', 'microcontrollers', 'microcontrollers', 'MICROCONTROLLERS', 'Compact integrated circuits containing processor core, memory, and programmable input/output peripherals.'),
  ('ARM', 'arm', 'arm', 'MICROCONTROLLERS', 'RISC-based processor architecture widely used in modern microcontrollers, mobile devices, and embedded computing.'),
  ('ESP32', 'esp32', 'esp32', 'MICROCONTROLLERS', 'Low-cost, low-power system on a chip with integrated Wi-Fi and dual-mode Bluetooth by Espressif.'),
  ('Arduino', 'arduino', 'arduino', 'MICROCONTROLLERS', 'Open-source electronics prototyping platform based on flexible, easy-to-use hardware and software.'),
  ('RTOS', 'rtos', 'rtos', 'RTOS', 'Real-time operating system intended for real-time applications that process data without buffer delays.'),
  ('FreeRTOS', 'freertos', 'freertos', 'RTOS', 'Market-leading open-source real-time operating system for microcontrollers and small microprocessors.'),
  ('Digital Electronics', 'digital electronics', 'digital-electronics', 'ELECTRONICS', 'Study and design of circuits that use discrete signals representing binary values (logic gates, flip-flops).'),
  ('Analog Electronics', 'analog electronics', 'analog-electronics', 'ELECTRONICS', 'Study and design of circuits with continuously variable signals (amplifiers, filters, power supplies).'),
  ('VLSI', 'vlsi', 'vlsi', 'VLSI', 'Very Large Scale Integration — process of creating integrated circuits by combining thousands of transistors onto a single chip.'),
  ('Verilog', 'verilog', 'verilog', 'VLSI', 'Hardware Description Language (HDL) used to model electronic systems and digital logic circuits.'),
  ('SystemVerilog', 'systemverilog', 'systemverilog', 'VLSI', 'Combined Hardware Description and Hardware Verification Language for complex digital and ASIC verification.'),
  ('RTL Design', 'rtl design', 'rtl-design', 'VLSI', 'Register-Transfer Level design abstraction for modeling digital circuits in terms of data flow between registers.'),
  ('FPGA', 'fpga', 'fpga', 'FPGA', 'Field-Programmable Gate Array — semiconductor device based around a matrix of configurable logic blocks.'),
  ('ASIC Design', 'asic design', 'asic-design', 'SEMICONDUCTOR', 'Application-Specific Integrated Circuit design customized for a particular use rather than intended for general-purpose use.'),
  ('UVM', 'uvm', 'uvm', 'VLSI', 'Universal Verification Methodology — standardized methodology for verifying integrated circuit designs.'),
  ('PCB Design', 'pcb design', 'pcb-design', 'PCB', 'Printed Circuit Board schematic capture, layout, routing, component placement, and manufacturing preparation.'),
  ('KiCad', 'kicad', 'kicad', 'TOOLS', 'Open-source electronic design automation (EDA) suite for schematic capture and PCB layout.'),
  ('Altium Designer', 'altium designer', 'altium-designer', 'TOOLS', 'Professional electronic design automation software package for printed circuit board design.'),
  ('Communication Systems', 'communication systems', 'communication-systems', 'COMMUNICATION', 'Principles and architecture of electronic information transmission across wired and wireless channels.'),
  ('DSP', 'dsp', 'dsp', 'COMMUNICATION', 'Digital Signal Processing — mathematical manipulation of digitized signals to improve or modify communication transmission.'),
  ('RF', 'rf', 'rf', 'RF_WIRELESS', 'Radio Frequency circuit analysis, matching networks, and electromagnetic radiation design.'),
  ('Wireless Communication', 'wireless communication', 'wireless-communication', 'RF_WIRELESS', 'Transmission of data over electromagnetic signals without electrical conductors.'),
  ('Antenna', 'antenna', 'antenna', 'RF_WIRELESS', 'Transducer designed to transmit or receive radio frequency electromagnetic waves.'),
  ('LoRa', 'lora', 'lora', 'COMMUNICATION', 'Low-power wide-area network modulation technology designed for long-range IoT wireless connectivity.'),
  ('Bluetooth', 'bluetooth', 'bluetooth', 'COMMUNICATION', 'Short-range wireless technology standard used for exchanging data between fixed and mobile devices.'),
  ('Wi-Fi', 'wi-fi', 'wi-fi', 'COMMUNICATION', 'Family of wireless network protocols based on the IEEE 802.11 family of standards.'),
  ('IoT', 'iot', 'iot', 'IOT', 'Internet of Things — network of physical objects embedded with sensors, software, and connectivity.'),
  ('IoT Protocols', 'iot protocols', 'iot-protocols', 'IOT', 'Communication protocols designed for resource-constrained IoT devices (MQTT, CoAP, HTTP, WebSockets).'),
  ('Edge Computing', 'edge computing', 'edge-computing', 'SOFTWARE', 'Distributed computing paradigm bringing computation and data storage closer to the sources of data.'),
  ('Edge AI', 'edge ai', 'edge-ai', 'SOFTWARE', 'Execution of artificial intelligence and machine learning algorithms locally on hardware devices.'),
  ('Robotics', 'robotics', 'robotics', 'ROBOTICS', 'Interdisciplinary branch of engineering combining electronics, mechanics, and computation for automated systems.'),
  ('ROS', 'ros', 'ros', 'ROBOTICS', 'Robot Operating System — flexible framework for writing robot software and managing communication nodes.'),
  ('Control Systems', 'control systems', 'control-systems', 'HARDWARE', 'System of devices that manages, commands, directs, or regulates the behavior of other devices using feedback loops.'),
  ('Git', 'git', 'git', 'TOOLS', 'Distributed version-control system for tracking changes in source code during software and hardware development.'),
  ('Linux', 'linux', 'linux', 'TOOLS', 'Open-source Unix-like operating system kernel widely used across embedded systems, servers, and tooling.'),
  ('SQL', 'sql', 'sql', 'SOFTWARE', 'Structured Query Language used to manage and query relational database management systems.'),
  ('Embedded Software', 'embedded software', 'embedded-software', 'EMBEDDED', 'Specialized programming code residing in non-volatile memory on dedicated physical hardware.'),
  ('Firmware Development', 'firmware development', 'firmware-development', 'EMBEDDED', 'Low-level device software development bridging hardware registers directly to application logic.'),
  ('Hardware Design', 'hardware design', 'hardware-design', 'HARDWARE', 'Architecting, designing, and assembling electronic circuits, modules, and hardware architectures.'),
  ('Hardware Verification', 'hardware verification', 'hardware-verification', 'HARDWARE', 'Methodical testing and formal proof processes to guarantee electronic hardware operates according to specification.'),
  ('IC Verification', 'ic verification', 'ic-verification', 'SEMICONDUCTOR', 'Verification of integrated circuits before tape-out using simulation, formal tools, and assertion-based testing.'),
  ('SoC Design', 'soc design', 'soc-design', 'SEMICONDUCTOR', 'System on a Chip design integrating all or most components of an electronic system into a single chip.'),
  ('RF Engineering', 'rf engineering', 'rf-engineering', 'RF_WIRELESS', 'Engineering discipline dealing with devices that produce or utilize signals in the radio frequency spectrum.'),
  ('Network Engineering', 'network engineering', 'network-engineering', 'COMMUNICATION', 'Design, configuration, and maintenance of computer and communication networking infrastructure.'),
  ('Data Analysis', 'data analysis', 'data-analysis', 'SOFTWARE', 'Process of inspecting, cleaning, transforming, and modeling data to discover useful career and technical insights.'),
  ('Machine Learning', 'machine learning', 'machine-learning', 'SOFTWARE', 'Study of computer algorithms that improve automatically through experience and the use of training data.')
ON CONFLICT (normalized_name) DO NOTHING;

-- ── 6. Seed Data: Canonical Skill Hierarchy Links ────────────────────────────
-- Established strictly per docs/05_DATABASE_SPEC.md §21:
--   Embedded Systems
--       ├── Embedded C
--       ├── Microcontrollers
--       └── RTOS
--             └── FreeRTOS
UPDATE public.skills s
SET parent_skill_id = p.id
FROM public.skills p
WHERE s.normalized_name = 'embedded c' AND p.normalized_name = 'embedded systems';

UPDATE public.skills s
SET parent_skill_id = p.id
FROM public.skills p
WHERE s.normalized_name = 'microcontrollers' AND p.normalized_name = 'embedded systems';

UPDATE public.skills s
SET parent_skill_id = p.id
FROM public.skills p
WHERE s.normalized_name = 'rtos' AND p.normalized_name = 'embedded systems';

UPDATE public.skills s
SET parent_skill_id = p.id
FROM public.skills p
WHERE s.normalized_name = 'freertos' AND p.normalized_name = 'rtos';

-- ── 7. Seed Data: Canonical Skill Aliases ─────────────────────────────────────
-- Unambiguous aliases mapped strictly to one canonical skill per docs/05_DATABASE_SPEC.md §22.
-- Idempotent: ON CONFLICT (normalized_alias) DO NOTHING ensures no duplicates.
INSERT INTO public.skill_aliases (skill_id, alias, normalized_alias)
SELECT s.id, a.alias, a.normalized_alias
FROM public.skills s
JOIN (
  VALUES
    ('esp32', 'ESP-32', 'esp-32'),
    ('esp32', 'Espressif ESP32', 'espressif esp32'),
    ('c++', 'Cpp', 'cpp'),
    ('freertos', 'Free RTOS', 'free rtos'),
    ('altium designer', 'Altium', 'altium'),
    ('kicad', 'Ki-Cad', 'ki-cad'),
    ('wi-fi', 'WiFi', 'wifi'),
    ('iot', 'Internet of Things', 'internet of things'),
    ('dsp', 'Digital Signal Processing', 'digital signal processing'),
    ('vlsi', 'Very Large Scale Integration', 'very large scale integration'),
    ('rtos', 'Real-Time Operating System', 'real-time operating system')
) AS a(target_skill, alias, normalized_alias)
  ON s.normalized_name = a.target_skill
ON CONFLICT (normalized_alias) DO NOTHING;
