/**
 * MEDI-TREND AI — Dedicated Wound Assessment Medical Translation Engine
 * Exclusively for the Wound Assessment Module (English / தமிழ் / Both)
 * 
 * Complies with strict medical safety:
 * - Decision-support only (never diagnoses definitively or prescribes surgery solely from photos)
 * - Preserves all clinical measurements, percentages, dates, and biomarker numbers intact
 * - Provides verified, clear, medically appropriate Tamil terminology
 */

export type WoundLanguageMode = 'en' | 'ta' | 'both';

export const WOUND_LANG_STORAGE_KEY = 'medi_trend_wound_language';

/**
 * Standard medical Tamil glossary for wound care
 */
export const MEDICAL_TAMIL_DICTIONARY: Record<string, string> = {
  // Tissue Types
  'granulation tissue': 'சிவப்பு தசை திசு (Granulation tissue)',
  'granulation': 'சிவப்பு தசை திசு (Granulation)',
  'yellow / tan slough': 'மஞ்சள் நிற சவ்வு / இறந்த திசு (Slough)',
  'yellow slough': 'மஞ்சள் சவ்வு (Slough)',
  'slough': 'மஞ்சள் சவ்வு (Slough)',
  'necrotic eschar': 'கருப்பு நிற நசிவு திசு (Necrotic Eschar)',
  'necrotic': 'நசிவு திசு (Necrotic)',
  'epithelialization': 'எபிதீலியல் விளிம்பு வளர்ச்சி (Epithelialization)',
  'viable': 'உயிருள்ள திசு',
  'non-viable': 'உயிரற்ற திசு',

  // Severity
  'mild / superficial': 'லேசானது / மேலோட்டமானது (Mild / Superficial)',
  'moderate / deepening': 'மிதமானது / ஆழமடைகிறது (Moderate / Deepening)',
  'severe / high risk': 'தீவிரமானது / அதிக ஆபத்து (Severe / High Risk)',
  'undetermined': 'தீர்மானிக்கப்படவில்லை (Undetermined)',

  // Categories
  'diabetic foot ulcer (dfu)': 'நீரிழிவு பாத புண் (Diabetic Foot Ulcer - DFU)',
  'diabetic foot ulcer': 'நீரிழிவு பாத புண் (Diabetic Foot Ulcer)',
  'venous leg ulcer (vlu)': 'சிரை இரத்த அழுத்த புண் (Venous Leg Ulcer - VLU)',
  'venous leg ulcer': 'சிரை இரத்த அழுத்த புண் (Venous Leg Ulcer)',
  'pressure injury / decubitus ulcer': 'அழுத்தப் புண் / படுக்கைப் புண் (Pressure Injury / Decubitus Ulcer)',
  'pressure ulcer': 'அழுத்தப் புண் (Pressure Ulcer)',
  'arterial ischemic ulcer': 'தமனி இரத்த ஓட்டக் குறைவு புண் (Arterial Ischemic Ulcer)',
  'peripheral arterial ischemic ulcer': 'தமனி இரத்த ஓட்டக் குறைவு புண் (Arterial Ischemic Ulcer)',
  'surgical wound dehiscence / postoperative wound': 'அறுவைசிகிச்சைக்குப் பிந்தைய தையல் பிரிதல் புண் (Surgical Dehiscence)',
  'surgical wound dehiscence': 'அறுவைசிகிச்சை தையல் பிரிதல் புண் (Surgical Dehiscence)',
  'neuropathic ulcer': 'நரம்பு உணர்விழப்பு புண் (Neuropathic Ulcer)',
  'cutaneous chronic / traumatic ulcer': 'நாள்பட்ட தோல் / காய புண் (Cutaneous Chronic Ulcer)',
  'unspecified chronic ulcer': 'குறிப்பிடப்படாத நாள்பட்ட புண் (Unspecified Chronic Ulcer)',

  // Progress
  'improving': 'முன்னேற்றம் காணப்படுகிறது (Improving)',
  'worsening': 'தீவிரமடைகிறது (Worsening)',
  'no clear change': 'குறிப்பிடத்தக்க மாற்றமில்லை (No Clear Change)',
  'unable to assess': 'மதிப்பிட முடியவில்லை (Unable to Assess)',

  // Discharge Amount & Types
  'scant': 'மிகக் குறைந்த அளவு (Scant)',
  'moderate': 'மிதமான அளவு (Moderate)',
  'heavy': 'அதிகப்படியான அளவு (Heavy)',
  'serosanguineous': 'சீரம் கலந்த இரத்தக் கசிவு (Serosanguineous)',
  'purulent': 'சீழ் கலந்த கசிவு (Purulent)',
  'serous': 'தெளிவான நீர்மக் கசிவு (Serous)',
  'sanguineous': 'இரத்தக் கசிவு (Sanguineous)',

  // Edge conditions
  'well-demarcated': 'தெளிவாக வரையறுக்கப்பட்ட விளிம்பு (Well-demarcated)',
  'maceration': 'ஈரப்பதத்தால் தோல் ஊறல்/மென்மையாதல் (Maceration)',
  'undermining': 'விளிம்புக்கடியில் குழிவு (Undermining)',
};

/**
 * Direct sentence mapping for standard rule-based clinical outputs
 */
export const CLINICAL_SENTENCE_MAP_TA: Record<string, string> = {
  // Bed appearance
  'Granulation tissue with localized yellow slough in wound base':
    'புண் படுகையில் உள்ளூர் மஞ்சள் சவ்வு (Slough) கலந்த சிவப்பு தசை திசு (Granulation tissue) காணப்படுகிறது.',
  'Predominantly healthy red granulation bed observed with minimal slough':
    'குறைந்த அளவு மஞ்சள் சவ்வுடன் கூடிய ஆரோக்கியமான சிவப்பு தசை திசு படுகை காணப்படுகிறது.',
  'Predominantly healthy red granulation bed observed with minimal slough.':
    'குறைந்த அளவு மஞ்சள் சவ்வுடன் கூடிய ஆரோக்கியமான சிவப்பு தசை திசு படுகை காணப்படுகிறது.',
  'Visible ulcer bed displays mixed granulation tissue with localized non-viable slough; warrants barrier protection and clinical review.':
    'புண் படுகையில் உள்ளூர் உயிரற்ற மஞ்சள் சவ்வுடன் கலந்த சிவப்பு தசை திசு காணப்படுகிறது; பாதுகாப்பு கட்டு மற்றும் மருத்துவ மறுஆய்வு தேவைப்படுகிறது.',
  'Prominent necrotic eschar identified; tissue viability, perfusion, and infection surveillance required.':
    'தெளிவான கருப்பு நிற நசிவு திசு (Necrotic eschar) கண்டறியப்பட்டுள்ளது; திசு உயிர்ப்புத்தன்மை, இரத்த ஓட்டம் மற்றும் தொற்று கண்காணிப்பு தேவைப்படுகிறது.',
  'Full-thickness cutaneous ulceration with partial slough coverage; requires protective offloading and infection surveillance.':
    'பகுதி மஞ்சள் சவ்வு மூடிய முழு-தடிமன் தோல் புண்; பாத அழுத்த நிவாரணம் (Offloading) மற்றும் தொற்று கண்காணிப்பு தேவைப்படுகிறது.',

  // Periwound & swelling
  'Mild localized erythema extending < 1cm from wound edge':
    'புண் விளிம்பிலிருந்து 1 செ.மீ-க்கும் குறைவாக பரவியுள்ள லேசான தோல் சிவத்தல் (Mild erythema).',
  'Localized erythema visible adjacent to wound margin; monitor boundary progression':
    'புண் விளிம்பிற்கு அருகில் தோல் சிவத்தல் காணப்படுகிறது; இதன் பரவலைத் தொடர்ந்து கண்காணிக்கவும்.',
  'Mild localized edema noted in adjacent tissue':
    'அருகிலுள்ள திசுக்களில் லேசான உள்ளூர் வீக்கம் (Edema) காணப்படுகிறது.',
  'Localized periwound edema observed':
    'புண்ணைச் சுற்றியுள்ள உள்ளூர் திசு வீக்கம் காணப்படுகிறது.',
  'Cannot assess odor from photograph':
    'புகைப்படத்திலிருந்து துர்நாற்றத்தை மதிப்பிட முடியாது (நேரடி பரிசோதனை தேவை).',
  'Well-demarcated with slight maceration at lower border':
    'கீழ் விளிம்பில் லேசான ஈரப்பதம்/ஊறலுடன் கூடிய தெளிவாக வரையறுக்கப்பட்ட எல்லை.',
  'Demarcated ulcer border with periwound moisture presence':
    'புண்ணைச் சுற்றியுள்ள ஈரப்பதத்துடன் கூடிய வரையறுக்கப்பட்ட புண் எல்லை.',

  // Scale & Dimensions
  'Scale calibration marker or reference ruler not detected in image. Precise wound dimensions and surface area cannot be reliably calculated from a photograph alone.':
    'படத்தில் அளவீட்டு அளவுகோல் அல்லது குறிப்பான் காணப்படவில்லை. புகைப்படத்திலிருந்து மட்டுமே துல்லியமான புண் பரிமாணங்கள் மற்றும் பரப்பளவை நம்பகத்தன்மையுடன் கணக்கிட முடியாது.',
  'Scale marker absent; visual approximation only':
    'அளவீட்டு குறிப்பான் இல்லை; காட்சி தோராய மதிப்பீடு மட்டுமே.',

  // Rationales
  'Plantar/distal foot location subject to biomechanical shear and neuropathic vulnerability.':
    'பாதத்தின் அடிப்பகுதி / முனையப் பகுதியில் உள்ள அழுத்தம் மற்றும் நரம்பு பாதிப்பு காரணங்களால் உருவான புண்.',
  'Lower extremity location characteristic of venous hypertension and periwound hemosiderin/stasis.':
    'கீழ் மூட்டு பகுதியில் சிரை இரத்த அழுத்த உயர்வு மற்றும் இரத்தத் தேக்கத்தால் ஏற்படும் புண் பண்புகள்.',
  'Anatomical site corresponds to bony prominence subject to sustained external pressure.':
    'தொடர்ச்சியான வெளிப்புற அழுத்தத்திற்கு ஆளாகும் எலும்புப் புடைப்பு பகுதியில் அமைந்துள்ள புண்.',
  'Linear anatomical margin consistent with postoperative closure breakdown.':
    'அறுவை சிகிச்சைக்குப் பிந்தைய தையல் விளிம்பு பிரிதலுடன் ஒத்துப்போகும் நேரியல் புண் விளிம்பு.',
  'Requires confirmation of pedal pulse palpation and arterial Doppler to rule out vascular insufficiency.':
    'இரத்தக் குழாய் அடைப்பை உறுதிப்படுத்த பாத நாடித்துடிப்பு பரிசோதனை மற்றும் டாப்ளர் ஆய்வு தேவைப்படுகிறது.',
  'Visible full-thickness dermal breakdown requiring formal clinical etiologic assessment.':
    'விரிவான மருத்துவ காரண அறிதல் ஆய்வு தேவைப்படும் முழு-தடிமன் தோல் சேதம்.',

  // Warning signs
  'Advancing periwound erythema spreading > 2 cm from the wound border.':
    'புண் விளிம்பிலிருந்து 2 செ.மீ-க்கு மேல் வேகமாகப் பரவும் தோல் சிவத்தல்.',
  'Visible tendon or bone in wound bed (immediate osteomyelitis evaluation required).':
    'புண் படுகையில் தசைநார் அல்லது எலும்பு தெரிதல் (உடனடி எலும்பு தொற்று / ஆஸ்டியோமைலிடிஸ் பரிசோதனை தேவை).',
  'Systemic symptoms such as fever, chills, altered mental status, or hemodynamic instability.':
    'காய்ச்சல், குளிர் நடுக்கம், மனக்குழப்பம் அல்லது நிலையற்ற இரத்த அழுத்தம் போன்ற உடல் அளவிலான அவசரத் தொற்று அறிகுறிகள்.',
  'Signs of progressive soft tissue crepitus, gangrene, or rapidly advancing necrosis.':
    'மென்மையான திசுக்களில் வாயு குமிழ்கள் (Crepitus), அழுகல் (Gangrene) அல்லது விரைவான திசு நசிவுக்கான அறிகுறிகள்.',
  'Sudden marked increase in purulent, malodorous exudate.':
    'திடீரென அதிகரிக்கும் துர்நாற்றத்துடன் கூடிய சீழ் கசிவு.',

  // Limitations
  '2D photograph does not permit reliable assessment of wound depth or tactile induration.':
    'இரு பரிமாண (2D) புகைப்படம் புண்ணின் ஆழத்தையோ அல்லது திசு கடினத்தன்மையையோ நம்பகத்தன்மையுடன் மதிப்பிட உதவாது.',
  'Photographic lighting and white balance may influence apparent tissue coloration.':
    'புகைப்படத்தின் ஒளி அமைப்பு மற்றும் நிற சமநிலை (White Balance) திசுக்களின் உண்மையான நிறத் தோற்றத்தை பாதிக்கலாம்.',
  'Physical probing (probe-to-bone test) cannot be performed on an image.':
    'எலும்பு தொடுதல் சோதனை (Probe-to-bone test) புகைப்படத்தில் செய்ய இயலாது; மருத்துவரின் நேரடி பரிசோதனை அவசியம்.',
  'Pedal pulse palpation and peripheral neuropathy (monofilament) testing must be performed clinically.':
    'பாத நாடித்துடிப்பு மற்றும் நரம்பு உணர்வு இழப்பு சோதனை (Monofilament) மருத்துவமனைக்குச் சென்று நேரில் செய்யப்பட வேண்டும்.',
  'Presence of deep sinus tracts or tunneling cannot be evaluated from surface photography.':
    'மேற்பரப்பு புகைப்படத்திலிருந்து புண்ணின் ஆழமான பாதைகள் (Sinus tracts) அல்லது சுரங்கப் பாதைகளை (Tunneling) கண்டறிய முடியாது.',
  'Photographic 2D image does not permit tactile evaluation of wound depth, tunneling, or tissue induration.':
    'இரு பரிமாண புகைப்படம் புண்ணின் ஆழம், சுரங்கப்பாதை அல்லது திசு கடினத்தன்மையை தொட்டுணர்ந்து அறிய உதவாது.',

  // Recommended assessments
  'Ankle-Brachial Index (ABI) and arterial Doppler to confirm adequate distal limb perfusion.':
    'காலில் போதுமான இரத்த ஓட்டம் உள்ளதா என்பதை உறுதிப்படுத்த கணுக்கால்-கைக்குழாய் இரத்த அழுத்த விகிதம் (ABI) மற்றும் தமனி டாப்ளர் பரிசோதனை.',
  '10g Semmes-Weinstein monofilament examination to evaluate protective sensory loss.':
    'பாதுகாப்பு உணர்வு இழப்பை மதிப்பிட 10 கிராம் செம்ஸ்-வெய்ன்ஸ்டீன் மோனோஃபிலமென்ட் சோதனை.',
  'Deep wound tissue swab or biopsy for microbiological culture if active infection is suspected.':
    'தீவிர தொற்று சந்தேகிக்கப்பட்டால் நுண்ணுயிரி வளர்ப்பு ஆய்வுக்காக (Culture & Sensitivity) ஆழமான திசு மாதிரி அல்லது ஸ்வாப் எடுத்தல்.',
  'Plain radiographs of the foot to rule out underlying osteomyelitis or soft-tissue gas.':
    'உட்புற எலும்பு தொற்று (Osteomyelitis) அல்லது மென்திசு வாயுவை விலக்க பாத எக்ஸ்ரே பரிசோதனை.',
  'Comprehensive glycemic control assessment including current HbA1c review.':
    'தற்போதைய HbA1c மதிப்பாய்வு உட்பட விரிவான இரத்த சர்க்கரை கட்டுப்பாட்டு பரிசோதனை.',

  // Wound care considerations
  'Maintain moist wound healing environment using non-adherent foam or hydrogel dressing.':
    'ஒட்டாத ஃபோம் (Foam) அல்லது ஹைட்ரோஜெல் கட்டு பயன்படுத்தி புண் குணமடைவதற்கு உகந்த ஈரப்பத சமநிலையைப் பராமரிக்கவும்.',
  'Perform gentle autolytic or conservative sharp debridement of non-viable yellow slough by trained staff.':
    'பயிற்சி பெற்ற மருத்துவ பணியாளரால் உயிரற்ற மஞ்சள் சவ்வை அகற்றும் பாதுகாப்பான சுத்திகரிப்பு (Debridement) செய்யப்பட வேண்டும்.',
  'Total contact casting or therapeutic offloading footwear to relieve plantar pressure points.':
    'பாத அழுத்தப் புள்ளிகளை விடுவிக்க டோட்டல் காண்டாக்ட் காஸ்ட் (TCC) அல்லது சிறப்பு ஆஃப்லோடிங் காலணிகளைப் பயன்படுத்தவும்.',
  'Avoid adhesive tapes directly on fragile periwound skin.':
    'புண்ணைச் சுற்றியுள்ள மென்மையான தோலின் மீது நேரடியாக பிசின் டேப்புகளை ஒட்டுவதைத் தவிர்க்கவும்.',
  'Cleanse ulcer bed with sterile normal saline before each dressing change.':
    'ஒவ்வொரு கட்டு மாற்றத்திற்கு முன்பும் மலட்டுத்தன்மையுள்ள சாதாரண உப்புநீரால் (Normal Saline) புண் படுகையை தூய்மைப்படுத்தவும்.',

  // Specialist referral triggers
  'Failure to demonstrate measurable reduction in wound area after 3 to 4 weeks of optimal care.':
    '3 முதல் 4 வார முறையான சிகிச்சைக்குப் பிறகும் புண் பரப்பளவில் அளவிடக்கூடிய குறைவு ஏற்படாத நிலை.',
  'Suspicion of deep space abscess, tracking sinus, or osteomyelitis.':
    'ஆழமான சீழ்க்கட்டி, உட்புற பாதை அல்லது எலும்பு தொற்று இருப்பதற்கான சந்தேகம்.',
  'Absent distal pedal pulses or ABI < 0.6 warranting urgent vascular surgery consultation.':
    'பாத நாடித்துடிப்பு இல்லாமை அல்லது ABI < 0.6 ஆக இருப்பது; இதற்கு அவசர இரத்தக்குழாய் அறுவைசிகிச்சை மருத்துவரின் ஆலோசனை தேவை.',
  'High-risk diabetic neuro-ischemic ulcer requiring multidisciplinary diabetic foot clinic care.':
    'பல்துறை நீரிழிவு பாத சிறப்பு மருத்துவமனையின் சிகிச்சை தேவைப்படும் அதிக ஆபத்துள்ள நரம்பு-இரத்தஓட்டக் குறைவு புண்.',

  // Surgical evaluation factors
  'Presence of extensive non-viable tissue, purulent tracking, or deep compartment infection requiring operative debridement.':
    'அறுவைசிகிச்சை மூலம் சுத்திகரிக்கப்பட வேண்டிய விரிவான உயிரற்ற திசு, சீழ் பரவல் அல்லது ஆழமான தொற்று இருப்பு.',
  'Critical limb-threatening ischemia requiring revascularization before wound healing can proceed.':
    'புண் ஆறுவதற்கு முன் இரத்த ஓட்டத்தை மீட்டெடுக்க வேண்டிய உயிருக்கு அல்லது காலுக்கு ஆபத்தான தீவிர ischemia நிலை.',
  'Depth of wound and involvement of deep fascia, joint capsule, or periosteum.':
    'புண்ணின் ஆழம் மற்றும் ஆழமான தசைத்திரை, மூட்டு உறை அல்லது எலும்பு மேற்பரப்பு பாதிப்பு.',
  'Need for surgical reconstructive coverage, skin grafting, or bony prominence resection (ostectomy).':
    'அறுவைசிகிச்சை மறுசீரமைப்பு மூடல், தோல் ஒட்டுதல் (Skin Grafting) அல்லது எலும்பு புடைப்பு நீக்குதல் தேவை.',
  'Response to optimal conservative outpatient wound management over consecutive visits.':
    'தொடர்ச்சியான வருகைகளில் முறையான வெளிப்புற புண் பராமரிப்பிற்கு கிடைக்கும் மருத்துவ முன்னேற்ற பதில்.',

  // Cautionary note
  'Healing progression must never be determined from image colour alone, as lighting, angle, and camera sensors vary between examinations.':
    'கேமரா ஒளி, கோணம் மற்றும் சென்சார் மாறுபாடுகளால் தோலின் நிறம் மாறுபடலாம்; குணமடைதலை புகைப்பட நிறத்திலிருந்து மட்டுமே தீர்மானிக்கக் கூடாது, மருத்துவரின் நேரடி பரிசோதனை கட்டாயம்.',
  'Reliable physical dimension change cannot be calculated because one or both images lack a calibrated scale reference marker.':
    'ஒன்று அல்லது இரண்டு படங்களிலும் அளவீட்டு அளவுகோல் குறிப்பான் இல்லாததால் துல்லியமான புண் பரிமாண மாற்றத்தைக் கணக்கிட முடியாது.',
};

/**
 * Translates an arbitrary medical wound text to clear Tamil while preserving
 * numbers, units, clinical terms, and formatting.
 */
export function translateWoundMedicalText(text: string | null | undefined): string {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  // Direct exact match
  if (CLINICAL_SENTENCE_MAP_TA[trimmed]) {
    return CLINICAL_SENTENCE_MAP_TA[trimmed];
  }

  // Check punctuation differences
  const withoutDot = trimmed.endsWith('.') ? trimmed.slice(0, -1) : trimmed;
  if (CLINICAL_SENTENCE_MAP_TA[withoutDot]) {
    return CLINICAL_SENTENCE_MAP_TA[withoutDot];
  }
  if (CLINICAL_SENTENCE_MAP_TA[withoutDot + '.']) {
    return CLINICAL_SENTENCE_MAP_TA[withoutDot + '.'];
  }

  // Lowercase match for short terms/categories
  const lower = trimmed.toLowerCase();
  if (MEDICAL_TAMIL_DICTIONARY[lower]) {
    return MEDICAL_TAMIL_DICTIONARY[lower];
  }

  // Handle longitudinal progress diff points
  if (trimmed.includes('Granulation tissue has expanded by')) {
    return trimmed
      .replace(/Granulation tissue has expanded by\s*([+\-\d]+%?),?\s*with non-viable slough reduced by\s*(\d+%?)\.?/gi,
        'சிவப்பு தசை திசு (Granulation) $1 விரிவடைந்துள்ளது, மற்றும் உயிரற்ற மஞ்சள் சவ்வு $2 குறைந்துள்ளது.')
      .replace(/Granulation tissue has expanded by/gi, 'சிவப்பு தசை திசு விரிவடைந்துள்ளது:');
  }

  if (trimmed.includes('Non-viable tissue burden has increased')) {
    return trimmed
      .replace(/Non-viable tissue burden has increased\s*\(Necrotic change:\s*([+\-\d]+%?),?\s*Slough change:\s*([+\-\d]+%?)\)\.?/gi,
        'உயிரற்ற திசு சுமை அதிகரித்துள்ளது (கருப்பு நசிவு திசு மாற்றம்: $1, மஞ்சள் சவ்வு மாற்றம்: $2).')
      .replace(/Non-viable tissue burden has increased/gi, 'உயிரற்ற திசு சுமை அதிகரித்துள்ளது');
  }

  if (trimmed.includes('Wound bed characteristics show stable tissue distribution')) {
    return trimmed
      .replace(/Wound bed characteristics show stable tissue distribution\s*\(Granulation:\s*(\d+%?)\s*->\s*(\d+%?),?\s*Slough:\s*(\d+%?)\s*->\s*(\d+%?)\)\.?/gi,
        'புண் படுகையின் திசு விநியோகம் நிலையான சமநிலையில் உள்ளது (சிவப்பு தசை: $1 -> $2, மஞ்சள் சவ்வு: $3 -> $4).');
  }

  if (trimmed.includes('Periwound status evolved from')) {
    return trimmed
      .replace(/Periwound status evolved from\s*'([^']+)'\s*to\s*'([^']+)'\.?/gi,
        'சுற்றியுள்ள தோல் சிவத்தல் நிலை "$1" என்பதிலிருந்து "$2" என மாறியுள்ளது.');
  }

  if (trimmed.includes('Measured wound surface area shifted from')) {
    return trimmed
      .replace(/Measured wound surface area shifted from\s*([\d\.]+)\s*cm²\s*to\s*([\d\.]+)\s*cm²\s*\(([+\-\d\.]+%?)\s*change\)\.?/gi,
        'அளவிடப்பட்ட புண் பரப்பளவு $1 cm²-லிருந்து $2 cm² ஆக மாறியுள்ளது ($3 மாற்றம்).');
  }

  if (trimmed.includes('Comparing examination on')) {
    // summary text
    return trimmed
      .replace(/Comparing examination on\s*([^\s]+)\s*with\s*([^\s:]+):/gi,
        '$1 மற்றும் $2 ஆகிய தேதிகளின் புண் பரிசோதனைகளை ஒப்பிடும்போது:')
      .replace(/Overall progression is assessed as\s*'([^']+)'\./gi,
        'ஒட்டுமொத்த குணமடைதல் முன்னேற்றம் "$1" என மதிப்பிடப்பட்டுள்ளது.')
      .replace(/Granulation shifted by\s*([+\-\d]+%?),?\s*slough shifted by\s*([+\-\d]+%?),?\s*and necrotic eschar shifted by\s*([+\-\d]+%?)\./gi,
        'சிவப்பு தசை $1, மஞ்சள் சவ்வு $2, மற்றும் கருப்பு நசிவு திசு $3 அளவு மாறியுள்ளது.')
      .replace(/Note: Apparent visual coloration can be influenced by camera exposure and white balance; healing progress should be validated by clinical palpation and physician review\./gi,
        'குறிப்பு: கேமரா ஒளி மற்றும் கோண வேறுபாடுகளால் தோலின் நிறம் மாறுபடலாம்; குணமடைதலை மருத்துவரின் நேரடி பரிசோதனை மூலம் மட்டுமே உறுதிப்படுத்த வேண்டும்.');
  }

  // Term replacement fallback while preserving numbers and measurements
  let translated = trimmed;
  for (const [enTerm, taTerm] of Object.entries(MEDICAL_TAMIL_DICTIONARY)) {
    const reg = new RegExp(`\\b${enTerm}\\b`, 'gi');
    if (reg.test(translated)) {
      translated = translated.replace(reg, taTerm);
    }
  }

  return translated;
}

/**
 * Anatomical locations in Tamil
 */
export const WOUND_LOCATIONS_TAMIL: Record<string, string> = {
  'Right Plantar Hallux': 'வலது பெருவிரல் அடிப்பகுதி (Right Plantar Hallux)',
  'Right Plantar Metatarsal Head': 'வலது பாத எலும்பு அடிப்பகுதி (Right Plantar Metatarsal Head)',
  'Right Heel': 'வலது குதிகால் (Right Heel)',
  'Left Plantar Hallux': 'இடது பெருவிரல் அடிப்பகுதி (Left Plantar Hallux)',
  'Left Plantar Metatarsal Head': 'இடது பாத எலும்பு அடிப்பகுதி (Left Plantar Metatarsal Head)',
  'Left Heel': 'இடது குதிகால் (Left Heel)',
  'Right Medial Malleolus': 'வலது உள்பக்க கணுக்கால் (Right Medial Malleolus)',
  'Right Lateral Malleolus': 'வலது வெளிப்பக்க கணுக்கால் (Right Lateral Malleolus)',
  'Left Medial Malleolus': 'இடது உள்பக்க கணுக்கால் (Left Medial Malleolus)',
  'Left Lateral Malleolus': 'இடது வெளிப்பக்க கணுக்கால் (Left Lateral Malleolus)',
  'Lower Extremity (Gaiter Region)': 'கீழ் மூட்டு / கணுக்கால் பகுதி (Gaiter Region)',
  'Sacrum / Coccyx': 'இடுப்பெலும்பு / வால் எலும்பு பகுதி (Sacrum / Coccyx)',
  'Ischial Tuberosity': 'புட்ட எலும்பு புடைப்பு (Ischial Tuberosity)',
  'Post-Surgical Abdominal Incision': 'அறுவைசிகிச்சைக்குப் பிந்தைய வயிற்றுத் தையல் (Abdominal Incision)',
  'Other / Custom Anatomical Site': 'பிற / தனிப்பயன் உடற்கூறியல் இடம்',
};

export function translateWoundLocation(loc: string): string {
  if (!loc) return '';
  return WOUND_LOCATIONS_TAMIL[loc] || loc;
}
