-- SQL Script to import task templates from tasks-template.json
-- This script converts the JSON data to properly formatted HTML for rich text fields

-- Clear existing templates if needed (uncomment if you want to start fresh)
-- DELETE FROM task_templates;

-- Insert task templates with properly formatted HTML content
INSERT INTO task_templates (title, instructions, equipment, safety, category)
VALUES
-- Tile Floors
(
    'Tile Floors',
    '<ol>
        <li>Sweep edges, corners, and behind doors.</li>
        <li>Sweep or dust mop remainder of floor, working from one side of the room to the other. Do not use a dust mop in restrooms.</li>
        <li>Collect debris and put in wastebasket.</li>
        <li>Place a wet floor warning sign at all entrances to the area.</li>
        <li>Wet mop floor using general-purpose cleaner.</li>
        <li>Rinse mop and bucket.</li>
    </ol>',
    '<ul>
        <li>Broom</li>
        <li>Dust mop (if needed)</li>
        <li>Dustpan</li>
        <li>Wastebasket</li>
        <li>Mop and bucket</li>
        <li>General-purpose cleaner</li>
        <li>Wet floor warning signs</li>
    </ul>',
    '<p>Place a wet floor warning sign at all entrances to mopped areas.</p>',
    'Floors'
),

-- Wood Floors
(
    'Wood Floors',
    '<ol>
        <li>Sweep edges, corners, and behind doors.</li>
        <li>Sweep remainder of floor, working from one side of the room to the other. For large floors, use a dust mop, shaking out the dust mop when finished.</li>
        <li>Collect debris and put in wastebasket.</li>
    </ol>',
    '<ul>
        <li>Broom</li>
        <li>Dust mop (if needed)</li>
        <li>Dustpan</li>
        <li>Wastebasket</li>
    </ul>',
    '',
    'Floors'
),

-- Carpet Floors
(
    'Carpet Floors',
    '<ol>
        <li>Check vacuum bags and canisters to make sure they are not full.</li>
        <li>Pick up large debris before vacuuming.</li>
        <li>Vacuum all dry carpeted areas with a vacuum appropriate for the area. Use a wide area vacuum for hallways and multipurpose rooms, an upright vacuum for classrooms and aisles, and a canister vacuum under chairs, inside hymnbook holders, and on the rostrum.</li>
        <li>Vacuum carpet mats in foyer areas.</li>
        <li>When finished, wind cords neatly.</li>
    </ol>',
    '<ul>
        <li>Wide area vacuum</li>
        <li>Upright vacuum</li>
        <li>Canister vacuum</li>
        <li>Extra vacuum bags</li>
    </ul>',
    '<p>Inspect cords to ensure they are in good condition. Do not run over the cord. Plug and unplug cords by the plug end, never by the cord. Don''t overextend the cord or add extension cords. Report faulty equipment to the ward building representative immediately.</p>',
    'Floors'
),

-- Outdoors
(
    'Outdoors',
    '<p><strong>During seasons without snow:</strong></p>
    <ol>
        <li>Pick up trash and debris on lawns, parking lots, dumpster areas, and adjacent Church-owned property.</li>
        <li>Sweep walkways.</li>
        <li>Pull weeds.</li>
    </ol>
    <p><strong>During seasons with snow:</strong></p>
    <ol>
        <li>Pick up trash and debris on lawns, parking lots, dumpster areas, and adjacent Church-owned property.</li>
        <li>Shovel walkways.</li>
        <li>Spread ice melt on shoveled walkways. Do not use ice melt in place of shoveling.</li>
    </ol>',
    '<ul>
        <li>Gloves</li>
        <li>Broom</li>
        <li>Dustpan</li>
        <li>Trash bag</li>
        <li>Snow shovel</li>
        <li>Ice melt</li>
    </ul>',
    '',
    'Exterior'
),

-- Toilets and Urinals
(
    'Toilets and Urinals',
    '<ol>
        <li>Flush.</li>
        <li>Apply general-purpose cleaner to the inside of the toilet or urinal (do not flush).</li>
        <li>Use a toilet brush to scrub the inside of the toilet or urinal.</li>
        <li>Apply general-purpose cleaner to a cloth or paper towel.</li>
        <li>For toilets, wipe the top, then the bottom, of the toilet seat.</li>
        <li>Wipe the outside areas of the toilet or urinal.</li>
        <li>Flush.</li>
    </ol>',
    '<ul>
        <li>General-purpose cleaner</li>
        <li>Toilet brush</li>
        <li>Cloth or paper towels</li>
        <li>Disposable gloves</li>
    </ul>',
    '<p>Wear disposable gloves when cleaning toilets and urinals. Wash hands after cleaning toilets and urinals.</p>',
    'Restrooms'
),

-- Hard Surfaces
(
    'Hard Surfaces',
    '<ol>
        <li>Apply general-purpose cleaner to the cleaning cloth or paper towel, not directly to the surface.</li>
        <li>Wipe surface clean.</li>
    </ol>
    <p>Applicable surfaces include door push plates and handles, tables, piano and organ keys (only the keys), metal chairs, handrails, countertops, telephones, sinks and faucets, drinking fountains, baby changing stations, and painted walls (spot clean as necessary).</p>',
    '<ul>
        <li>General-purpose cleaner</li>
        <li>Cloth or paper towels</li>
    </ul>',
    '',
    'General'
),

-- Wood Furniture and Trim
(
    'Wood Furniture and Trim',
    '<ol>
        <li>Using a dry dusting cloth or fluffy duster, dust furniture and trim, including door frames, chair rails, baseboards, and picture frames.</li>
        <li>Apply general-purpose cleaner to a cloth and clean wood on pews and chairs as well as the pulpit top.</li>
    </ol>',
    '<ul>
        <li>Dry dusting cloth or fluffy duster</li>
        <li>Cloth</li>
        <li>General-purpose cleaner</li>
    </ul>',
    '',
    'Furniture'
),

-- Restroom Products
(
    'Restroom Products',
    '<p>Items to refill and replace include:</p>
    <ul>
        <li>Hand soap (refill or replace)</li>
        <li>Toilet paper (replace empty rolls)</li>
        <li>Paper towels (replace empty rolls or fully stock)</li>
        <li>Tissues (replace when empty)</li>
    </ul>
    <p>After refilling or replacing, check dispensers to ensure they operate correctly and ask the ward building representative for additional training if needed.</p>',
    '<ul>
        <li>Hand soap refill</li>
        <li>Paper towel refills</li>
        <li>Toilet paper rolls</li>
        <li>Dispenser keys (if applicable)</li>
    </ul>',
    '<p>Clean up spills that occur during refilling and replacing.</p>',
    'Restrooms'
),

-- Wastebaskets
(
    'Wastebaskets',
    '<ol>
        <li>Dump small amounts of trash into a larger collection bag.</li>
        <li>If trash is wet or smelly:
            <ol type="A">
                <li>If the wastebasket is dirty, apply general-purpose cleaner to a cloth or paper towel and clean it.</li>
                <li>Leave one extra bag in the bottom of each wastebasket.</li>
                <li>Replace the bag, tying a knot if it is larger than the can.</li>
            </ol>
        </li>
        <li>Put trash in a garbage can or dumpster that will be emptied by a disposal company or the city.</li>
    </ol>',
    '<ul>
        <li>Bags (of various sizes)</li>
        <li>Large collection bag</li>
        <li>General-purpose cleaner</li>
        <li>Cloth or paper towels</li>
    </ul>',
    '<p>Never reach in a wastebasket to remove trash. Objects in the trash may be hazardous.</p>',
    'General'
),

-- Fabric Furniture
(
    'Fabric Furniture',
    '<ol>
        <li>Check the canister in the vacuum to ensure it is not full.</li>
        <li>Remove large pieces of trash before vacuuming.</li>
        <li>Vacuum fabric surfaces and crevices; fabric furniture includes sofas, chairs, pews, and rostrum seats.</li>
    </ol>',
    '<ul>
        <li>Canister vacuum</li>
    </ul>',
    '<p>Do not stand on furniture to reach high spots on chalkboards. If necessary, ask a taller individual for assistance.</p>',
    'Furniture'
),

-- Chalkboards
(
    'Chalkboards',
    '<ol>
        <li>Erase the board without applying cleaner or water.</li>
        <li>Wipe the tray with a damp cloth or paper towel to prevent chalk dust from falling on the floor.</li>
    </ol>',
    '<ul>
        <li>Cloth or paper towel</li>
        <li>Eraser</li>
        <li>Dustpan</li>
    </ul>',
    '',
    'Classroom'
),

-- Glass and Mirrors
(
    'Glass and Mirrors',
    '<ol>
        <li>Apply glass cleaner to a cloth or paper towel.</li>
        <li>Clean glass and mirror surfaces.</li>
        <li>Wipe metal and plastic around windows and mirrors.</li>
        <li>Clean both sides of all entry glass below eight feet (doors and windows).</li>
    </ol>
    <p><strong>Additional tips:</strong> Clean from top to bottom and focus on removing smudges and fingerprints.</p>',
    '<ul>
        <li>Cloth or paper towels</li>
        <li>Glass cleaner</li>
    </ul>',
    '',
    'General'
); 