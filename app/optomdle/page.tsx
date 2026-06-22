"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";

const ANIMATION_CSS = `
@keyframes optom-pop {
  0%   { opacity: 0; transform: scale(0.82); }
  65%  { transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes optom-fadein {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes optom-fadeout {
  from { opacity: 1; transform: translateY(0); }
  to   { opacity: 0; transform: translateY(-6px); }
}
@keyframes hint-flip {
  0%   { transform: scaleY(1); }
  50%  { transform: scaleY(0.01); }
  100% { transform: scaleY(1); }
}
.hint-flip {
  animation: hint-flip 0.48s ease-in-out;
  transform-origin: center;
}
@keyframes hint-flash-red {
  0%   { box-shadow: 0 0 0 0 rgba(224,112,112,0); }
  25%  { box-shadow: 0 0 0 2px rgba(224,112,112,0.9), 0 0 22px rgba(224,112,112,0.28); }
  75%  { box-shadow: 0 0 0 2px rgba(224,112,112,0.5), 0 0 14px rgba(224,112,112,0.14); }
  100% { box-shadow: 0 0 0 0 rgba(224,112,112,0); }
}
.hint-flash-red {
  animation: hint-flash-red 0.55s ease-out;
}
`;

// ── Types & data ──────────────────────────────────────────────────────────────

type Case = {
  diagnosis: string;
  hints: [string, string, string, string, string, string];
};

const CASES: Case[] = [
  {
    diagnosis: "Myopia",
    hints: [
      "A 22-year-old university student reports difficulty reading the board in lecture halls.",
      "Near vision is completely clear — they can read their phone without any correction.",
      "Symptoms first appeared around age 10 and have worsened steadily through their teens.",
      "Retinoscopy reveals a myopic reflex requiring significant minus-power correction.",
      "Axial length is measured at 25.8 mm on biometry — notably above the normal range.",
      "Final refraction: –3.50 –0.50 × 180 OU. Single-vision distance spectacles prescribed.",
    ],
  },
  {
    diagnosis: "Hyperopia",
    hints: [
      "A 35-year-old presents with frontal headaches and tired eyes after extended reading sessions.",
      "Distance vision is generally clear; near tasks are consistently more difficult.",
      "Symptoms improve significantly after resting the eyes for several minutes.",
      "Cycloplegic refraction reveals a substantial latent component not seen on dry refraction.",
      "Amplitude of accommodation is reduced relative to the patient's age.",
      "Final prescription: +2.25 sphere OU. Reading glasses provide immediate symptomatic relief.",
    ],
  },
  {
    diagnosis: "Astigmatism",
    hints: [
      "A 28-year-old reports ghosting and a shadow around letters when reading signs at distance.",
      "The distortion is present at both near and far viewing distances equally.",
      "Keratometry reveals unequal curvature across the two principal meridians of the cornea.",
      "Retinoscopy shows a scissor reflex with different neutralization points in each meridian.",
      "Pinhole testing provides only partial improvement in visual acuity.",
      "Prescription includes a cylindrical component: –1.75 × 180 OU. Acuity corrects to 20/20.",
    ],
  },
  {
    diagnosis: "Presbyopia",
    hints: [
      "A 47-year-old reports they have started holding restaurant menus at arm's length to read them.",
      "Distance vision remains clear and is unchanged from their exam two years prior.",
      "The change has been gradual over the past 18 months.",
      "Push-up amplitude of accommodation testing reveals a near point of 40 cm.",
      "Over-the-counter reading glasses (+1.50) offer only partial and inconsistent relief.",
      "Near addition of +1.75 OU prescribed; progressive lenses recommended for full-time wear.",
    ],
  },
  {
    diagnosis: "Primary Open-Angle Glaucoma",
    hints: [
      "A 58-year-old presents for a routine exam and reports no visual symptoms whatsoever.",
      "IOP measures 26 mmHg OD and 24 mmHg OS on Goldmann applanation tonometry.",
      "Automated visual field testing reveals a superior arcuate scotoma in the right eye.",
      "Cup-to-disc ratio is 0.7 bilaterally with inferior neuroretinal rim thinning noted.",
      "The patient's father lost vision to the same condition in his early sixties.",
      "OCT of the optic nerve head shows significant RNFL thinning inferotemporal OU.",
    ],
  },
  {
    diagnosis: "Nuclear Sclerotic Cataract",
    hints: [
      "A 71-year-old reports that their vision has become progressively foggy over the past two years.",
      "Glare from oncoming headlights while driving at night has become a significant concern.",
      "Colors appear more yellowed and washed out compared to a few years ago.",
      "The patient has required three prescription changes in the last four years.",
      "Monocular diplopia is noted when the right eye is tested in isolation.",
      "Slit lamp reveals nuclear sclerosis grade 3+ OD and 2+ OS; surgical referral placed.",
    ],
  },
  {
    diagnosis: "Evaporative Dry Eye",
    hints: [
      "A 38-year-old office worker reports burning and stinging eyes that worsen throughout the day.",
      "Paradoxically, the patient's eyes water excessively despite the persistent burning sensation.",
      "Symptoms worsen in air-conditioned environments and during prolonged screen use.",
      "Fluorescein staining reveals punctate epithelial erosions across the inferior cornea.",
      "Meibomian gland dropout is noted on meibography; expressed secretions are thick and opaque.",
      "TBUT measured at 4 seconds OU. Artificial tears and warm compresses twice daily initiated.",
    ],
  },
  {
    diagnosis: "Bacterial Conjunctivitis",
    hints: [
      "A 6-year-old is brought in after waking with one eye stuck completely shut.",
      "Mucopurulent discharge is present with heavy eyelid crusting along the lash margin.",
      "By day two, conjunctival injection and discharge have spread to involve both eyes.",
      "A sibling developed identical symptoms two days after the patient's onset.",
      "The child had a mild cold and runny nose in the preceding week.",
      "Gram stain of discharge shows gram-positive cocci; empirical topical antibiotic drops prescribed.",
    ],
  },
  {
    diagnosis: "Keratoconus",
    hints: [
      "A 19-year-old reports rapidly worsening vision that is no longer fully correctable with glasses.",
      "Retinoscopy reveals a prominent scissor reflex that is difficult to neutralize in any meridian.",
      "Corneal topography shows inferior steepening and markedly irregular astigmatism.",
      "Slit lamp examination reveals Vogt's striae and a Fleischer ring at the base of the cone.",
      "Corneal pachymetry at the apex measures 420 μm — well below normal range.",
      "Rigid gas-permeable lenses prescribed for now; corneal cross-linking referral placed.",
    ],
  },
  {
    diagnosis: "Wet Age-related Macular Degeneration",
    hints: [
      "A 74-year-old reports a blurry, dark spot that has developed in the centre of their vision.",
      "The Amsler grid test shows marked distortion — straight lines appear wavy or bent.",
      "Peripheral vision remains entirely unaffected.",
      "Fundus examination reveals soft drusen deposits and pigmentary changes throughout the macula.",
      "The patient is a former smoker whose sibling has received the same diagnosis.",
      "OCT shows subretinal fluid and RPE disruption; urgent referral to a retinal specialist placed.",
    ],
  },
  {
    diagnosis: "Proliferative Diabetic Retinopathy",
    hints: [
      "A 54-year-old with a 12-year history of type 2 diabetes presents for their annual eye exam.",
      "The patient currently reports no visual symptoms.",
      "Fundus examination reveals dot-blot and flame-shaped haemorrhages in all four quadrants.",
      "Hard exudates are visible within one disc diameter of the fovea in the right eye.",
      "HbA1c is reported at 9.2%, indicating poor long-term glycaemic control.",
      "Neovascularisation of the disc is identified bilaterally; same-day urgent referral to retina specialist.",
    ],
  },
  {
    diagnosis: "Anisometropic Amblyopia",
    hints: [
      "A 7-year-old fails their school vision screening in the left eye only.",
      "Best corrected visual acuity is 20/20 OD and 20/80 OS with full spectacle correction in place.",
      "No structural abnormality is found on slit lamp or dilated fundus examination.",
      "The crowding phenomenon is noted — isolated optotypes are read more easily than a full row.",
      "Significant anisometropia has been documented since the child's first eye exam at age four.",
      "Patching of the fellow eye initiated at 2 hours daily; review scheduled in 8 weeks.",
    ],
  },
  {
    diagnosis: "Accommodative Esotropia",
    hints: [
      "Parents report their 4-year-old's left eye turns inward, particularly when the child is tired.",
      "The child never complains of seeing double.",
      "Cover test reveals a constant esotropia of 20 prism diopters at both near and distance.",
      "Cycloplegic refraction reveals bilateral hyperopia of +3.50 DS.",
      "Stereopsis is reduced to 400 seconds of arc on Randot stereoacuity testing.",
      "Full optical correction prescribed first; referral to paediatric ophthalmology for surgical evaluation.",
    ],
  },
  {
    diagnosis: "Demodex Blepharitis",
    hints: [
      "A 45-year-old presents with crusty, itchy eyelids that are worst every morning on waking.",
      "Collarettes — cylindrical, sleeve-like deposits — are visible at the base of multiple lashes.",
      "Symptoms have persisted for several months and did not respond to antihistamines.",
      "Meibomian gland expression yields thick, toothpaste-like secretions rather than clear oil.",
      "Epilated lashes examined microscopically reveal Demodex mites at the root.",
      "Lid hygiene routine, warm compresses, and tea tree oil lid wipes prescribed; omega-3 supplementation advised.",
    ],
  },
  {
    diagnosis: "Posterior Vitreous Detachment",
    hints: [
      'A 62-year-old reports a sudden onset of new floaters they describe as "a cobweb in my vision."',
      "A large, ring-shaped floater (Weiss ring) is visible on dilated fundus examination.",
      "The patient also notices flashing lights in the temporal field of the affected eye.",
      "Careful peripheral retinal examination with scleral depression reveals no breaks or tears.",
      "The onset was acute — the patient first noticed it while reading the morning of presentation.",
      "OCT confirms separation of the posterior vitreous face from the optic nerve head.",
    ],
  },
  {
    diagnosis: "Rhegmatogenous Retinal Detachment",
    hints: [
      'A 55-year-old reports a "dark curtain" rising from the bottom of their visual field since this morning.',
      "This was preceded by three days of suddenly increased floaters and photopsia.",
      "Visual acuity in the affected eye has dropped to 20/200.",
      "The patient is a high myope (–8.00 D) with a known history of peripheral lattice degeneration.",
      "Fundus examination confirms a macula-on bullous detachment with a superior horseshoe tear.",
      "Same-day emergency referral to vitreoretinal surgery; B-scan ultrasound confirms elevated retina.",
    ],
  },
  {
    diagnosis: "Anterior Uveitis",
    hints: [
      "A 32-year-old presents with a painful, red eye and pronounced photophobia over 48 hours.",
      "Visual acuity is mildly reduced to 20/40 in the affected eye.",
      "Slit lamp examination shows 3+ cells and significant flare in the anterior chamber.",
      "Keratic precipitates are visible on the inferior corneal endothelium.",
      "The patient carries a confirmed diagnosis of ankylosing spondylitis.",
      "Posterior synechiae are beginning to form; cycloplegic drops and topical corticosteroids initiated.",
    ],
  },
  {
    diagnosis: "Optic Neuritis",
    hints: [
      "A 28-year-old woman presents with progressive, painful vision loss in one eye over three days.",
      "Pain is markedly worse with eye movement in any direction.",
      "Red colour vision is significantly reduced — she describes the red of a stop sign as washed out.",
      "A relative afferent pupillary defect (RAPD) is present in the right eye.",
      "The optic disc appears entirely normal — the lesion is retrobulbar.",
      "MRI reveals a periventricular white matter lesion; neurology referral placed urgently.",
    ],
  },
  {
    diagnosis: "Central Serous Retinopathy",
    hints: [
      "A 36-year-old man reports a blurry, washed-out spot in the centre of his vision for two weeks.",
      "Objects in the affected eye appear smaller and more distant than in the fellow eye (micropsia).",
      "The patient recently completed an intense, high-pressure work deadline.",
      "OCT imaging reveals a dome of subretinal fluid elevating the neurosensory retina beneath the macula.",
      'Fundus fluorescein angiography demonstrates a classic "smokestack" pattern of leakage.',
      "A Type A personality and corticosteroid use are noted; spontaneous resolution expected within 3 months.",
    ],
  },
  {
    diagnosis: "Corneal Abrasion",
    hints: [
      "A 24-year-old contact lens wearer presents with acute, severe eye pain and photophobia.",
      "The patient reports something caught under their contact lens during removal the previous night.",
      "Visual acuity is reduced to 20/60 in the affected eye.",
      "Fluorescein staining under cobalt blue illumination reveals a 3 mm epithelial defect on the central cornea.",
      "Eversion of the upper lid reveals no residual foreign body.",
      "Bandage soft contact lens applied; prophylactic topical antibiotic and lubricating drops prescribed.",
    ],
  },
];

const ALL_DIAGNOSES = [
  // Refractive
  "Myopia",
  "High Myopia",
  "Hyperopia",
  "Astigmatism",
  "Irregular Astigmatism",
  "Presbyopia",
  "Anisometropia",
  "Anisekonia",
  // Cornea
  "Keratoconus",
  "Pellucid Marginal Degeneration",
  "Keratoglobus",
  "Corneal Ectasia",
  "Corneal Abrasion",
  "Corneal Ulcer",
  "Corneal Foreign Body",
  "Recurrent Corneal Erosion",
  "Exposure Keratopathy",
  "Neurotrophic Keratopathy",
  "Superficial Punctate Keratitis",
  "Bacterial Keratitis",
  "Viral Keratitis",
  "Herpes Simplex Keratitis",
  "Herpes Zoster Ophthalmicus",
  "Acanthamoeba Keratitis",
  "Fungal Keratitis",
  "Interstitial Keratitis",
  "Thygeson's Superficial Punctate Keratopathy",
  "Fuchs' Endothelial Dystrophy",
  "Map-Dot-Fingerprint Dystrophy",
  "Granular Corneal Dystrophy",
  "Lattice Corneal Dystrophy",
  "Macular Corneal Dystrophy",
  "Posterior Polymorphous Corneal Dystrophy",
  "Salzmann's Nodular Degeneration",
  "Terrien's Marginal Degeneration",
  "Band Keratopathy",
  "Arcus Senilis",
  "Pterygium",
  "Pinguecula",
  "Corneal Neovascularization",
  "Corneal Graft Rejection",
  "Chemical Burn",
  // Conjunctiva & sclera
  "Conjunctivitis",
  "Bacterial Conjunctivitis",
  "Viral Conjunctivitis",
  "Allergic Conjunctivitis",
  "Giant Papillary Conjunctivitis",
  "Vernal Keratoconjunctivitis",
  "Atopic Keratoconjunctivitis",
  "Superior Limbic Keratoconjunctivitis",
  "Subconjunctival Haemorrhage",
  "Conjunctivochalasis",
  "Conjunctival Nevus",
  "Mucous Membrane Pemphigoid",
  "Stevens-Johnson Syndrome",
  "Episcleritis",
  "Scleritis",
  "Necrotising Scleritis",
  // Lids & adnexa
  "Blepharitis",
  "Seborrhoeic Blepharitis",
  "Demodex Blepharitis",
  "Anterior Blepharitis",
  "Meibomian Gland Dysfunction",
  "Hordeolum",
  "Chalazion",
  "Ectropion",
  "Entropion",
  "Trichiasis",
  "Ptosis",
  "Dermatochalasis",
  "Lagophthalmos",
  "Floppy Eyelid Syndrome",
  "Benign Essential Blepharospasm",
  "Hemifacial Spasm",
  "Dacryocystitis",
  "Nasolacrimal Duct Obstruction",
  "Dacryoadenitis",
  "Canaliculitis",
  "Preseptal Cellulitis",
  "Orbital Cellulitis",
  "Basal Cell Carcinoma",
  "Sebaceous Cell Carcinoma",
  "Ocular Rosacea",
  // Dry eye
  "Dry Eye Syndrome",
  "Evaporative Dry Eye",
  "Aqueous Deficient Dry Eye",
  "Sjögren's Syndrome",
  // Anterior segment / uvea
  "Anterior Uveitis",
  "Iritis",
  "Iridocyclitis",
  "Intermediate Uveitis",
  "Pars Planitis",
  "Posterior Uveitis",
  "Panuveitis",
  "Fuchs' Uveitis Syndrome",
  "Sympathetic Ophthalmia",
  "Hyphema",
  "Hypopyon",
  "Rubeosis Iridis",
  "Iris Atrophy",
  "Aniridia",
  // Glaucoma
  "Primary Open-Angle Glaucoma",
  "Normal Tension Glaucoma",
  "Ocular Hypertension",
  "Angle-Closure Glaucoma",
  "Acute Angle-Closure Glaucoma",
  "Chronic Angle-Closure Glaucoma",
  "Pigmentary Glaucoma",
  "Pseudoexfoliation Glaucoma",
  "Neovascular Glaucoma",
  "Traumatic Glaucoma",
  "Steroid-Induced Glaucoma",
  "Juvenile Open-Angle Glaucoma",
  "Congenital Glaucoma",
  "Glaucoma",
  // Lens
  "Cataracts",
  "Nuclear Sclerotic Cataract",
  "Cortical Cataract",
  "Posterior Subcapsular Cataract",
  "Anterior Subcapsular Cataract",
  "Posterior Capsule Opacification",
  "Ectopia Lentis",
  "Lens Subluxation",
  // Vitreous & retina
  "Posterior Vitreous Detachment",
  "Vitreous Haemorrhage",
  "Asteroid Hyalosis",
  "Retinal Detachment",
  "Rhegmatogenous Retinal Detachment",
  "Tractional Retinal Detachment",
  "Exudative Retinal Detachment",
  "Retinal Tear",
  "Lattice Degeneration",
  "Retinoschisis",
  "Macular Hole",
  "Epiretinal Membrane",
  "Vitreomacular Traction",
  "Diabetic Retinopathy",
  "Non-Proliferative Diabetic Retinopathy",
  "Proliferative Diabetic Retinopathy",
  "Diabetic Macular Oedema",
  "Age-related Macular Degeneration",
  "Dry Age-related Macular Degeneration",
  "Wet Age-related Macular Degeneration",
  "Central Serous Retinopathy",
  "Choroidal Neovascularisation",
  "Polypoidal Choroidal Vasculopathy",
  "Central Retinal Artery Occlusion",
  "Branch Retinal Artery Occlusion",
  "Central Retinal Vein Occlusion",
  "Branch Retinal Vein Occlusion",
  "Hypertensive Retinopathy",
  "Sickle Cell Retinopathy",
  "Radiation Retinopathy",
  "Commotio Retinae",
  "Choroidal Rupture",
  "Coat's Disease",
  "Retinoblastoma",
  "Choroidal Melanoma",
  "Choroidal Naevus",
  "Retinitis Pigmentosa",
  "Stargardt Disease",
  "Best Disease",
  "Cone Dystrophy",
  "Rod-Cone Dystrophy",
  "Choroideremia",
  "Gyrate Atrophy",
  "Bietti's Crystalline Dystrophy",
  "Sorsby's Fundus Dystrophy",
  "X-linked Juvenile Retinoschisis",
  "Enhanced S-Cone Syndrome",
  "Achromatopsia",
  "Ocular Toxoplasmosis",
  "Cytomegalovirus Retinitis",
  "Acute Retinal Necrosis",
  "Birdshot Retinochoroidopathy",
  "Multifocal Choroiditis",
  "Punctate Inner Choroidopathy",
  "Serpiginous Choroiditis",
  "Multiple Evanescent White Dot Syndrome",
  "Acute Zonal Occult Outer Retinopathy",
  "Familial Exudative Vitreoretinopathy",
  // Optic nerve & neuro-ophthalmic
  "Optic Neuritis",
  "Ischaemic Optic Neuropathy",
  "Anterior Ischaemic Optic Neuropathy",
  "Non-Arteritic Anterior Ischaemic Optic Neuropathy",
  "Arteritic Anterior Ischaemic Optic Neuropathy",
  "Toxic Optic Neuropathy",
  "Nutritional Optic Neuropathy",
  "Leber's Hereditary Optic Neuropathy",
  "Optic Nerve Hypoplasia",
  "Optic Disc Drusen",
  "Optic Disc Pit",
  "Morning Glory Syndrome",
  "Papilloedema",
  "Compressive Optic Neuropathy",
  "Optic Nerve Glioma",
  "Internuclear Ophthalmoplegia",
  "Horner Syndrome",
  "Adie's Tonic Pupil",
  "Argyll Robertson Pupil",
  "Third Nerve Palsy",
  "Fourth Nerve Palsy",
  "Sixth Nerve Palsy",
  "Nystagmus",
  "Congenital Nystagmus",
  // Strabismus & binocularity
  "Strabismus",
  "Esotropia",
  "Accommodative Esotropia",
  "Intermittent Exotropia",
  "Exotropia",
  "Hypertropia",
  "Amblyopia",
  "Anisometropic Amblyopia",
  "Convergence Insufficiency",
  "Convergence Excess",
  "Divergence Insufficiency",
  "Duane Retraction Syndrome",
  "Brown Syndrome",
  "Superior Oblique Myokymia",
  // Systemic with ocular manifestations
  "Thyroid Eye Disease",
  "Giant Cell Arteritis",
  "Sarcoidosis",
  "Behçet's Disease",
  "Vogt-Koyanagi-Harada Syndrome",
  "Systemic Lupus Erythematosus",
  "Rheumatoid Arthritis",
  "Multiple Sclerosis",
  "Ankylosing Spondylitis",
  "Granulomatosis with Polyangiitis",
  "Ocular Syphilis",
  "Ocular Tuberculosis",
  "HIV Retinopathy",
  "Dermatomyositis",
  "Myasthenia Gravis",
  // Rare syndromes & systemic
  "Marfan Syndrome",
  "Homocystinuria",
  "Ehlers-Danlos Syndrome",
  "Usher Syndrome",
  "Bardet-Biedl Syndrome",
  "Alport Syndrome",
  "Wilson's Disease",
  "Fabry Disease",
  "Albinism",
  "Sturge-Weber Syndrome",
  "Neurofibromatosis Type 1",
  "Von Hippel-Lindau Disease",
  "Tuberous Sclerosis",
  "Incontinentia Pigmenti",
  "Cystinosis",
  "Mucopolysaccharidosis",
  "Kearns-Sayre Syndrome",
  "Mitochondrial Retinopathy",
  "Abetalipoproteinaemia",
  "Refsum Disease",
  "Neuronal Ceroid Lipofuscinosis",
  "Joubert Syndrome",
  "Senior-Løken Syndrome",
  "Cohen Syndrome",
  // Trauma & contact lens
  "Corneal Abrasion",
  "Globe Rupture",
  "Orbital Blowout Fracture",
  "Hyphema",
  "Angle Recession",
  "Contact Lens-Associated Red Eye",
  "Microbial Keratitis",
  "Contact Lens Papillary Conjunctivitis",
].sort();

const EPOCH_DAY = Math.floor(new Date("2026-01-01").getTime() / 86400000);

function getTodayDay(): number {
  return Math.floor(Date.now() / 86400000) - EPOCH_DAY;
}

// ── Persistence ───────────────────────────────────────────────────────────────

const LS_KEY = "optomdle-v1";

type Saved = { day: number; guesses: string[] };

function loadSaved(day: number): string[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const s: Saved = JSON.parse(raw);
    return s.day === day ? s.guesses : [];
  } catch {
    return [];
  }
}

function persist(day: number, guesses: string[]) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ day, guesses }));
  } catch {}
}

// ── User statistics ───────────────────────────────────────────────────────────

const STATS_KEY = "optomdle-stats-v1";

type UserStats = {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  maxStreak: number;
  lastDayPlayed: number;
};

const DEFAULT_STATS: UserStats = {
  gamesPlayed: 0,
  wins: 0,
  currentStreak: 0,
  maxStreak: 0,
  lastDayPlayed: -1,
};

function loadStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw
      ? { ...DEFAULT_STATS, ...JSON.parse(raw) }
      : { ...DEFAULT_STATS };
  } catch {
    return { ...DEFAULT_STATS };
  }
}

function recordGame(dayNumber: number, won: boolean): UserStats {
  const s = loadStats();
  if (s.lastDayPlayed === dayNumber) return s;
  const newStreak = won
    ? s.lastDayPlayed === dayNumber - 1
      ? s.currentStreak + 1
      : 1
    : 0;
  const updated: UserStats = {
    gamesPlayed: s.gamesPlayed + 1,
    wins: s.wins + (won ? 1 : 0),
    currentStreak: newStreak,
    maxStreak: Math.max(s.maxStreak, newStreak),
    lastDayPlayed: dayNumber,
  };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(updated));
  } catch {}
  return updated;
}

// ── Diagnosis definitions ─────────────────────────────────────────────────────

const DIAGNOSIS_DEFS: Record<string, string> = {
  Myopia:
    "A refractive error in which close objects are seen clearly but distant objects appear blurred, caused by an elongated eyeball or steep corneal curvature.",
  Hyperopia:
    "A refractive error in which the focal point falls behind the retina, causing near objects to appear blurred and producing eye strain.",
  Astigmatism:
    "An imperfection in the curvature of the cornea or lens that causes blurred or distorted vision at all distances.",
  Presbyopia:
    "Age-related loss of the crystalline lens's ability to change shape for near focus, typically beginning in the mid-40s.",
  Glaucoma:
    "A group of optic neuropathies characterised by progressive retinal ganglion cell loss, often associated with elevated intraocular pressure.",
  "Primary Open-Angle Glaucoma":
    "The most common form of glaucoma, characterised by open iridocorneal angles, elevated IOP, progressive RNFL thinning, and arcuate visual field loss — often asymptomatic until advanced.",
  Cataracts:
    "Clouding of the crystalline lens that leads to progressive, painless reduction in visual clarity, most commonly due to ageing.",
  "Nuclear Sclerotic Cataract":
    "Age-related hardening and yellowing of the lens nucleus causing progressive blur, glare, myopic shift, and colour desaturation — the most common cataract type in adults.",
  "Dry Eye Syndrome":
    "A multifactorial disease of the tear film causing ocular surface discomfort, visual disturbance, and potential corneal damage.",
  "Evaporative Dry Eye":
    "The most prevalent dry eye subtype, driven by meibomian gland dysfunction that accelerates tear evaporation, causing instability, corneal staining, and ocular surface inflammation.",
  Conjunctivitis:
    "Inflammation of the conjunctiva causing redness, discharge, and irritation, triggered by infection, allergy, or chemical exposure.",
  "Bacterial Conjunctivitis":
    "Conjunctival inflammation caused by bacterial infection, presenting with purulent discharge, lid crusting, and bilateral spread — typically self-limiting but responsive to topical antibiotics.",
  Keratoconus:
    "A progressive ectatic condition in which the cornea thins and steepens into a cone shape, inducing irregular astigmatism.",
  "Age-related Macular Degeneration":
    "A degenerative disease of the central retina causing progressive loss of central vision, driven by drusen accumulation and RPE atrophy.",
  "Wet Age-related Macular Degeneration":
    "The neovascular form of AMD, in which choroidal new vessels breach Bruch's membrane causing rapid central vision loss — treated with intravitreal anti-VEGF injections.",
  "Diabetic Retinopathy":
    "A microvascular complication of diabetes that damages retinal blood vessels, leading to haemorrhage, exudate, and potential neovascularisation.",
  "Proliferative Diabetic Retinopathy":
    "The advanced stage of diabetic retinopathy characterised by retinal neovascularisation, which risks vitreous haemorrhage and tractional detachment — requiring urgent laser or anti-VEGF treatment.",
  Amblyopia:
    "Reduced visual acuity in one eye due to abnormal visual development in early childhood, not correctable by optical means alone.",
  "Anisometropic Amblyopia":
    "Amblyopia arising from a significant refractive difference between the two eyes, causing chronic defocus in one eye during the critical period of visual development.",
  Strabismus:
    "A condition in which the eyes are misaligned and do not fixate on the same point simultaneously, due to extraocular muscle imbalance.",
  "Accommodative Esotropia":
    "A convergent strabismus driven by uncorrected hyperopia, where excessive accommodative effort stimulates disproportionate convergence — managed first with full optical correction.",
  Blepharitis:
    "Chronic inflammation of the eyelid margins, commonly driven by bacterial overgrowth or meibomian gland dysfunction.",
  "Demodex Blepharitis":
    "Eyelid margin inflammation caused by Demodex mite infestation, characterised by collarette deposits at lash bases and refractory to standard blepharitis treatments — responds to tea tree oil.",
  "Posterior Vitreous Detachment":
    "A common age-related separation of the vitreous gel from the inner retinal surface, presenting with floaters and flashes.",
  "Retinal Detachment":
    "Separation of the neurosensory retina from the underlying RPE, constituting an ophthalmic emergency requiring prompt surgical intervention.",
  "Rhegmatogenous Retinal Detachment":
    "The most common retinal detachment subtype, caused by a full-thickness retinal break that allows vitreous fluid to track beneath the neurosensory retina — associated with high myopia and lattice degeneration.",
  "Anterior Uveitis":
    "Inflammation of the anterior uveal tract (iris and ciliary body), presenting with pain, photophobia, and a hypopyon in severe cases.",
  "Optic Neuritis":
    "Inflammatory demyelination of the optic nerve causing acute painful visual loss, strongly associated with multiple sclerosis.",
  "Central Serous Retinopathy":
    "Accumulation of subretinal fluid beneath the macula, typically in young men under stress, causing metamorphopsia and micropsia.",
  "Corneal Abrasion":
    "A superficial defect in the corneal epithelium caused by trauma, producing acute pain, tearing, and photophobia.",
  "Angle Closure Glaucoma":
    "Acute or chronic obstruction of the iridocorneal drainage angle, causing a rapid rise in intraocular pressure and potential optic nerve damage.",
  "Normal Tension Glaucoma":
    "Progressive optic neuropathy with characteristic glaucomatous field loss occurring despite consistently normal intraocular pressure.",
  "Vitreous Haemorrhage":
    "Bleeding into the vitreous cavity that obscures the visual axis, most commonly from retinal neovascularisation or trauma.",
  Chalazion:
    "A chronic, painless granulomatous lesion of the eyelid caused by obstruction and lipid spillage from a meibomian gland.",
  Pterygium:
    "A fleshy fibrovascular overgrowth from the conjunctiva onto the corneal surface, associated with chronic UV exposure.",
  "Corneal Ulcer":
    "A full-thickness epithelial defect with stromal involvement, typically caused by bacterial, viral, or fungal infection.",
  "Retinitis Pigmentosa":
    "A hereditary retinal dystrophy causing progressive photoreceptor degeneration, night blindness, and constricted visual fields.",
  Uveitis:
    "Intraocular inflammation affecting the uveal tract, which may be infectious, autoimmune, or idiopathic in origin.",
  "Branch Retinal Vein Occlusion":
    "Obstruction of a tributary retinal vein causing sectoral haemorrhages, macular oedema, and sudden visual field loss.",
  "Central Retinal Artery Occlusion":
    "Occlusion of the main retinal artery producing sudden, painless, profound monocular visual loss requiring emergency evaluation.",
};

function getDiagnosisDef(diagnosis: string): string {
  return (
    DIAGNOSIS_DEFS[diagnosis] ??
    `${diagnosis}: A condition managed within the scope of optometric or ophthalmic practice.`
  );
}

// ── Theme (Clinical Dark Lab) ─────────────────────────────────────────────────

const T = {
  bg: "#0E1523",
  surface: "#141D2E",
  surfaceRaised: "#1C2740",
  surfaceHover: "#1E2B45",
  border: "rgba(255,255,255,0.07)",
  borderLight: "rgba(255,255,255,0.13)",
  borderDashed: "rgba(255,255,255,0.12)",
  teal: "#00B4C6",
  tealBg: "rgba(0,180,198,0.08)",
  tealBorder: "rgba(0,180,198,0.22)",
  tealGlow: "0 0 0 1.5px rgba(0,180,198,0.45), 0 4px 28px rgba(0,180,198,0.10)",
  coral: "#E07070",
  coralBg: "rgba(224,112,112,0.08)",
  coralBorder: "rgba(224,112,112,0.20)",
  shadow: "0 2px 14px rgba(0,0,0,0.40)",
  shadowMd: "0 8px 36px rgba(0,0,0,0.55)",
  text: {
    primary: "#E8EDF5",
    secondary: "#9EA8BC",
    muted: "#627089",
    dim: "#3A4257",
  },
};

// ── Confetti ──────────────────────────────────────────────────────────────────

function Confetti({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const COLORS = [
      "#00B4C6",
      "#E07070",
      "#F59E0B",
      "#A78BFA",
      "#34D399",
      "#60A5FA",
      "#F472B6",
    ];
    const particles = Array.from({ length: 90 }, (_, i) => ({
      x: window.innerWidth * (0.15 + Math.random() * 0.7),
      y: -20 - Math.random() * 120,
      w: Math.random() * 9 + 4,
      h: Math.random() * 5 + 2,
      color: COLORS[i % COLORS.length],
      vx: (Math.random() - 0.5) * 3.5,
      vy: Math.random() * 3 + 1.5,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.18,
    }));

    let raf: number;
    const start = performance.now();

    const draw = (now: number) => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const fade = elapsed > 1600 ? Math.max(0, 1 - (elapsed - 1600) / 900) : 1;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.07;
        p.angle += p.spin;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);
        ctx.globalAlpha = fade;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      if (elapsed < 2500) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 100,
      }}
    />
  );
}

// ── Performance label ─────────────────────────────────────────────────────────

const PERF_LABELS = [
  "Remarkable",
  "Excellent",
  "Impressive",
  "Good",
  "Nice",
  "Close Call",
];

function perfLabel(guessCount: number, won: boolean): string {
  if (!won) return "Case Unresolved";
  return PERF_LABELS[guessCount - 1] ?? "Congratulations";
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Optomdle() {
  const dayNumber = useMemo(getTodayDay, []);
  const daily = useMemo(() => CASES[dayNumber % CASES.length], [dayNumber]);

  const [guesses, setGuesses] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIdx, setActiveIdx] = useState(-1);
  const [statusMsg, setStatusMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [cardRevealed, setCardRevealed] = useState<boolean[]>(
    Array(6).fill(false),
  );
  const [cardAnimating, setCardAnimating] = useState<boolean[]>(
    Array(6).fill(false),
  );

  const [flashingCardIdx, setFlashingCardIdx] = useState(-1);
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_STATS);
  const [timeToMidnight, setTimeToMidnight] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(false);
  const prevHintsRef = useRef(0);
  const wrongGuessFlashRef = useRef(false);

  useEffect(() => {
    setGuesses(loadSaved(dayNumber));
    setUserStats(loadStats());
    setHydrated(true);
    if (!localStorage.getItem("optomdle-seen")) setShowHowToPlay(true);
  }, [dayNumber]);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeToMidnight(
        `${String(h).padStart(2, "0")}h : ${String(m).padStart(2, "0")}m : ${String(s).padStart(2, "0")}s`,
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const wrongGuesses = guesses.filter(
    (g) => g.toLowerCase() !== daily.diagnosis.toLowerCase(),
  );
  const won = guesses.some(
    (g) => g.toLowerCase() === daily.diagnosis.toLowerCase(),
  );
  const lost = !won && wrongGuesses.length >= 6;
  const gameOver = won || lost;
  const hintsRevealed = gameOver ? 6 : Math.min(wrongGuesses.length + 1, 6);

  const flipCard = useCallback((idx: number, delay = 0) => {
    setTimeout(() => {
      setCardAnimating((prev) => {
        const n = [...prev];
        n[idx] = true;
        return n;
      });
      setTimeout(() => {
        setCardRevealed((prev) => {
          const n = [...prev];
          n[idx] = true;
          return n;
        });
      }, 240);
      setTimeout(() => {
        setCardAnimating((prev) => {
          const n = [...prev];
          n[idx] = false;
          return n;
        });
      }, 480);
    }, delay);
  }, []);

  useEffect(() => {
    if (!hydrated || mountedRef.current) return;
    mountedRef.current = true;
    prevHintsRef.current = hintsRevealed;
    for (let i = 0; i < hintsRevealed; i++) flipCard(i, i * 380);
    if (gameOver && hintsRevealed > 0) {
      setTimeout(() => setShowModal(true), (hintsRevealed - 1) * 380 + 800);
    }
  }, [hydrated, hintsRevealed, gameOver, flipCard]);

  useEffect(() => {
    if (!hydrated || !mountedRef.current) return;
    if (hintsRevealed > prevHintsRef.current) {
      const start = prevHintsRef.current;
      // Delay flip until after the red flash when triggered by a wrong guess
      const baseDelay = wrongGuessFlashRef.current ? 580 : 60;
      wrongGuessFlashRef.current = false;
      for (let i = start; i < hintsRevealed; i++) {
        flipCard(i, (i - start) * 200 + baseDelay);
      }
      prevHintsRef.current = hintsRevealed;
    }
  }, [hintsRevealed, hydrated, flipCard]);

  useEffect(() => {
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }
    const q = input.toLowerCase();
    setSuggestions(
      ALL_DIAGNOSES.filter((d) => d.toLowerCase().includes(q)).slice(0, 6),
    );
  }, [input]);

  const submit = () => {
    if (gameOver || !input.trim()) return;
    const trimmed = input.trim();
    const correct = trimmed.toLowerCase() === daily.diagnosis.toLowerCase();
    const next = [...guesses, trimmed];
    setGuesses(next);
    persist(dayNumber, next);
    setInput("");
    setSuggestions([]);
    setActiveIdx(-1);
    if (correct) {
      const stats = recordGame(dayNumber, true);
      setUserStats(stats);
      setShowConfetti(true);
      setTimeout(() => setShowModal(true), 800);
    } else {
      const newWrong = wrongGuesses.length + 1;
      // Flash the current card red before the next hint reveals
      wrongGuessFlashRef.current = true;
      setFlashingCardIdx(hintsRevealed - 1);
      setTimeout(() => setFlashingCardIdx(-1), 560);
      if (newWrong < 6) {
        setStatusMsg(`Incorrect — hint ${newWrong + 1} unlocked`);
        setTimeout(() => setStatusMsg(""), 2200);
      } else {
        const stats = recordGame(dayNumber, false);
        setUserStats(stats);
        setTimeout(() => setShowModal(true), 700);
      }
    }
  };

  const dismissInput = () => {
    inputRef.current?.blur();
    setSuggestions([]);
    setActiveIdx(-1);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((p) => Math.min(p + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((p) => Math.max(p - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions.length > 0) {
        // Select highlighted suggestion or default to first — never submit mid-autocomplete
        const pick = activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
        setInput(pick);
        setSuggestions([]);
        setActiveIdx(-1);
      } else {
        submit();
      }
    } else if (e.key === "Escape") {
      dismissInput();
    }
  };

  const emojiCard = () => {
    const score = won ? `${guesses.length}/6` : "X/6";
    const rows = guesses
      .map((g) =>
        g.toLowerCase() === daily.diagnosis.toLowerCase() ? "🟢" : "🔴",
      )
      .join("");
    return `Optomdle #${dayNumber + 1} ${score}\n\n${rows}\n\nhttps://indika.dev/optomdle`;
  };

  const copyShare = () => {
    navigator.clipboard.writeText(emojiCard()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!hydrated) return null;

  const label = perfLabel(guesses.length, won);

  // Card classification
  const currentCardIdx = gameOver ? -1 : hintsRevealed - 1;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: ANIMATION_CSS }} />
      <Confetti active={showConfetti} />

      {/* Top pill notification */}
      {statusMsg && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 150,
            background: "rgba(14,21,35,0.88)",
            border: `1px solid ${T.coralBorder}`,
            borderRadius: 100,
            padding: "8px 18px",
            fontSize: 13,
            color: T.coral,
            fontWeight: 600,
            whiteSpace: "nowrap" as const,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            pointerEvents: "none",
            animation: "optom-fadein 0.18s ease both",
          }}
        >
          {statusMsg}
        </div>
      )}

      {/* How to Play modal */}
      {showHowToPlay && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            background: "rgba(14,21,35,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 440,
              position: "relative",
              animation: "optom-fadein 0.35s ease both",
            }}
          >
            <button
              onClick={() => {
                localStorage.setItem("optomdle-seen", "1");
                setShowHowToPlay(false);
              }}
              aria-label="Close"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                zIndex: 10,
                background: "none",
                border: "none",
                fontSize: 26,
                lineHeight: 1,
                cursor: "pointer",
                color: T.text.muted,
                padding: 4,
                fontFamily: "inherit",
              }}
            >
              ×
            </button>

            <h2
              style={{
                fontFamily:
                  "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
                fontSize: 28,
                fontWeight: 400,
                letterSpacing: -0.3,
                margin: "0 0 4px",
                color: T.text.primary,
              }}
            >
              How to Play
            </h2>
            <p
              style={{
                fontSize: 13,
                color: T.text.muted,
                margin: "0 0 28px",
                letterSpacing: 0.1,
              }}
            >
              Identify the optometry diagnosis from clinical hints.
            </p>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 28,
              }}
            >
              {[
                { n: 1, text: "A new clinical case is presented every day." },
                {
                  n: 2,
                  text: "Type a diagnosis in the search box and submit your guess.",
                },
                {
                  n: 3,
                  text: "Each wrong guess unlocks the next clinical hint.",
                },
                {
                  n: 4,
                  text: "Identify the correct diagnosis within 6 guesses to win.",
                },
              ].map(({ n, text }) => (
                <div
                  key={n}
                  style={{ display: "flex", gap: 14, alignItems: "flex-start" }}
                >
                  <span
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: T.teal,
                      color: T.bg,
                      fontSize: 12,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  >
                    {n}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: T.text.secondary,
                      lineHeight: 1.65,
                    }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "14px 18px",
                marginBottom: 28,
                boxShadow: T.shadow,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: T.text.muted,
                  margin: "0 0 10px",
                  letterSpacing: "0.09em",
                  textTransform: "uppercase" as const,
                }}
              >
                Example hint
              </p>
              <div style={{ display: "flex", gap: 14 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: T.teal,
                    minWidth: 20,
                    marginTop: 2,
                  }}
                >
                  01
                </span>
                <span
                  style={{
                    fontSize: 13,
                    color: T.text.primary,
                    lineHeight: 1.65,
                  }}
                >
                  A 22-year-old reports difficulty reading the board in lecture
                  halls, but near vision is perfect.
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                localStorage.setItem("optomdle-seen", "1");
                setShowHowToPlay(false);
              }}
              style={{
                background: T.teal,
                color: T.bg,
                border: "none",
                borderRadius: 10,
                padding: "13px 0",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 0.1,
                width: "100%",
              }}
            >
              Let&apos;s Play
            </button>
          </div>
        </div>
      )}

      {/* Results modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            background: "rgba(14,21,35,0.97)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 420,
              padding: "24px 20px 40px",
              animation: "optom-fadein 0.3s ease both",
            }}
          >
            {/* Close row */}
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginBottom: 20,
              }}
            >
              <button
                onClick={() => {
                  window.scrollTo(0, 0);
                  setShowModal(false);
                }}
                aria-label="Close"
                style={{
                  background: "none",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  width: 44,
                  height: 44,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 22,
                  lineHeight: 1,
                  cursor: "pointer",
                  color: T.text.muted,
                  fontFamily: "inherit",
                }}
              >
                ×
              </button>
            </div>

            {/* Headline */}
            <div
              style={{
                fontFamily:
                  "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
                fontSize: 48,
                fontWeight: 400,
                letterSpacing: -0.5,
                color: won ? T.teal : T.coral,
                marginBottom: 6,
                textAlign: "center",
                animation:
                  "optom-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) 0.1s both",
              }}
            >
              {label}
            </div>

            {/* Guess count subtitle */}
            {won && (
              <div
                style={{
                  fontSize: 13,
                  color: T.text.muted,
                  marginBottom: 24,
                  letterSpacing: 0.1,
                  textAlign: "center",
                }}
              >
                {`Identified in ${guesses.length} of 6 ${guesses.length === 1 ? "guess" : "guesses"}`}
              </div>
            )}
            {!won && <div style={{ marginBottom: 24 }} />}

            {/* Diagnosis pill */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  background: won ? T.tealBg : T.coralBg,
                  border: `1px solid ${won ? T.tealBorder : T.coralBorder}`,
                  borderRadius: 8,
                  padding: "9px 18px",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: T.text.muted,
                    letterSpacing: "0.09em",
                    textTransform: "uppercase" as const,
                  }}
                >
                  Diagnosis
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 600,
                    color: won ? T.teal : T.coral,
                  }}
                >
                  {daily.diagnosis}
                </span>
              </div>
            </div>

            {/* Educational definition */}
            <p
              style={{
                fontSize: 13,
                color: T.text.muted,
                lineHeight: 1.7,
                marginBottom: 32,
                textAlign: "center",
                padding: "0 4px",
              }}
            >
              {getDiagnosisDef(daily.diagnosis)}
            </p>

            {/* Stats grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 8,
                marginBottom: 24,
              }}
            >
              {[
                { value: String(userStats.gamesPlayed), label: "Played" },
                {
                  value:
                    userStats.gamesPlayed > 0
                      ? `${Math.round((userStats.wins / userStats.gamesPlayed) * 100)}%`
                      : "0%",
                  label: "Win %",
                },
                {
                  value: `${userStats.currentStreak}${userStats.currentStreak > 0 ? " 🔥" : ""}`,
                  label: "Streak",
                },
                { value: String(userStats.maxStreak), label: "Best" },
              ].map(({ value, label: statLabel }) => (
                <div
                  key={statLabel}
                  style={{
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 10,
                    padding: "14px 8px",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      color: T.text.primary,
                      lineHeight: 1.2,
                      marginBottom: 4,
                    }}
                  >
                    {value}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: T.text.muted,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase" as const,
                    }}
                  >
                    {statLabel}
                  </div>
                </div>
              ))}
            </div>

            {/* Next case countdown */}
            <div
              style={{
                textAlign: "center",
                marginBottom: 24,
                color: T.text.muted,
                fontSize: 13,
              }}
            >
              <span style={{ marginRight: 6 }}>Next case in</span>
              <span
                style={{
                  fontFamily: "monospace",
                  color: T.text.secondary,
                  fontWeight: 600,
                }}
              >
                {timeToMidnight}
              </span>
            </div>

            {/* Emoji share card */}
            <div
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: "16px 20px",
                fontFamily: "monospace",
                fontSize: 14,
                color: T.text.secondary,
                marginBottom: 12,
                whiteSpace: "pre" as const,
                lineHeight: 2,
                textAlign: "left" as const,
              }}
            >
              {emojiCard()}
            </div>

            <button
              onClick={copyShare}
              style={{
                background: T.teal,
                color: T.bg,
                border: "none",
                borderRadius: 10,
                padding: "13px 0",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 0.1,
                opacity: copied ? 0.8 : 1,
                transition: "opacity 0.2s",
                width: "100%",
              }}
            >
              {copied ? "Copied to clipboard" : "Share Result"}
            </button>
          </div>
        </div>
      )}

      {/* Page */}
      <div
        onPointerDown={dismissInput}
        onScroll={dismissInput}
        style={{
          minHeight: "100vh",
          background: T.bg,
          color: T.text.primary,
          fontFamily:
            "var(--font-geist-sans), system-ui, -apple-system, sans-serif",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            padding: "18px 20px 12px",
          }}
        >
          <h1
            style={{
              fontFamily:
                "var(--font-instrument-serif), Georgia, 'Times New Roman', serif",
              fontSize: 32,
              fontWeight: 400,
              letterSpacing: -0.3,
              margin: "0 0 4px",
              color: T.text.primary,
              lineHeight: 1,
            }}
          >
            Optomdle
          </h1>
          <p
            style={{
              fontSize: 11,
              color: T.text.muted,
              margin: 0,
              letterSpacing: "0.07em",
              textTransform: "uppercase" as const,
              fontWeight: 500,
            }}
          >
            Identify the diagnosis
          </p>
        </div>

        {/* Clue Timeline */}
        <div
          style={{
            width: "100%",
            maxWidth: 600,
            margin: "0 auto",
            padding: "0 20px",
          }}
        >
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: T.text.dim,
              letterSpacing: "0.10em",
              textTransform: "uppercase" as const,
              margin: "0 0 14px",
            }}
          >
            Clinical Case
          </p>

          {daily.hints.map((hint, i) => {
            const isRevealed = cardRevealed[i];
            const isAnimating = cardAnimating[i];
            const isCurrent = isRevealed && i === currentCardIdx;
            const isPast = isRevealed && !isCurrent;

            return (
              <div
                key={i}
                className={
                  isAnimating
                    ? "hint-flip"
                    : i === flashingCardIdx
                      ? "hint-flash-red"
                      : ""
                }
                style={{
                  background: isRevealed ? T.surface : "rgba(255,255,255,0.03)",
                  border: isRevealed
                    ? `1px solid ${isCurrent ? "transparent" : T.border}`
                    : "1px dashed rgba(255,255,255,0.14)",
                  borderRadius: 12,
                  padding: "14px 20px",
                  minHeight: 52,
                  display: "flex",
                  gap: 16,
                  alignItems: "flex-start",
                  opacity: isPast ? 0.62 : 1,
                  boxShadow: isCurrent
                    ? T.tealGlow
                    : isRevealed
                      ? T.shadow
                      : "none",
                  marginBottom: 10,
                  boxSizing: "border-box" as const,
                  transition: isAnimating
                    ? "none"
                    : "opacity 0.4s ease, box-shadow 0.4s ease",
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    fontFamily: "monospace",
                    color: isCurrent
                      ? T.teal
                      : isRevealed
                        ? T.text.muted
                        : T.text.dim,
                    minWidth: 20,
                    marginTop: 3,
                    flexShrink: 0,
                    letterSpacing: 0.5,
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {isRevealed ? (
                  <span
                    style={{
                      fontSize: 14,
                      lineHeight: 1.65,
                      color: isPast ? T.text.secondary : T.text.primary,
                    }}
                  >
                    {hint}
                  </span>
                ) : (
                  <div style={{ flex: 1 }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Sticky input bar — renders outside the scroll content via fixed positioning */}

        {/* Dismissed Hypotheses */}
        {wrongGuesses.length > 0 && (
          <div
            style={{
              width: "100%",
              maxWidth: 600,
              margin: "32px auto 0",
              padding: "0 20px",
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: T.text.dim,
                letterSpacing: "0.10em",
                textTransform: "uppercase" as const,
                margin: "0 0 12px",
              }}
            >
              Dismissed Hypotheses
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {wrongGuesses.map((g) => (
                <div
                  key={g}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: T.coralBg,
                    border: `1px solid ${T.coralBorder}`,
                    borderRadius: 100,
                    padding: "5px 14px 5px 10px",
                    fontSize: 12,
                    color: T.coral,
                    fontWeight: 500,
                    letterSpacing: 0.1,
                  }}
                >
                  <span
                    style={{ fontSize: 11, fontWeight: 700, opacity: 0.75 }}
                  >
                    ×
                  </span>
                  <span>{g}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Show Results */}
        {gameOver && !showModal && (
          <div
            style={{ textAlign: "center", marginTop: 28, paddingBottom: 32 }}
          >
            <button
              onClick={() => setShowModal(true)}
              style={{
                background: "transparent",
                color: T.text.secondary,
                border: `1px solid ${T.borderLight}`,
                borderRadius: 10,
                padding: "10px 28px",
                fontSize: 13,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: 0.1,
                boxShadow: T.shadow,
              }}
            >
              Show Results
            </button>
          </div>
        )}

        {/* Space so content isn't hidden behind the sticky bar */}
        {!gameOver && <div style={{ height: 120 }} />}
      </div>

      {/* Sticky bottom input bar */}
      {!gameOver && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 50,
            background: T.bg,
            borderTop: `1px solid ${T.borderLight}`,
            boxShadow: "0 -4px 24px rgba(0,0,0,0.45)",
            padding: "10px 20px 12px",
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (suggestions.length > 0) {
                const pick =
                  activeIdx >= 0 ? suggestions[activeIdx] : suggestions[0];
                setInput(pick);
                setSuggestions([]);
                setActiveIdx(-1);
              } else {
                submit();
              }
            }}
            style={{
              display: "flex",
              gap: 8,
              maxWidth: 600,
              margin: "0 auto",
              position: "relative",
            }}
          >
            <div style={{ flex: 1, position: "relative" }}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setActiveIdx(-1);
                }}
                onKeyDown={handleKey}
                onFocus={() => {
                  setTimeout(() => {
                    inputRef.current?.scrollIntoView({
                      block: "end",
                      behavior: "smooth",
                    });
                  }, 300);
                }}
                onBlur={() => setTimeout(() => setSuggestions([]), 150)}
                placeholder="Search diagnoses..."
                autoComplete="off"
                style={{
                  width: "100%",
                  boxSizing: "border-box" as const,
                  background: T.surface,
                  border: `1px solid ${T.borderLight}`,
                  borderRadius: 10,
                  padding: "0 16px",
                  height: 48,
                  fontSize: 15,
                  color: T.text.primary,
                  outline: "none",
                  fontFamily: "inherit",
                  boxShadow: T.shadow,
                }}
              />
              {/* Dropdown opens upward */}
              {suggestions.length > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "calc(100% + 6px)",
                    left: 0,
                    right: 0,
                    background: T.surfaceRaised,
                    border: `1px solid ${T.borderLight}`,
                    borderRadius: 10,
                    overflow: "hidden",
                    zIndex: 20,
                    boxShadow: T.shadowMd,
                    maxHeight: "60vh",
                    overflowY: "auto" as const,
                  }}
                >
                  {suggestions.map((s, idx) => (
                    <div
                      key={s}
                      onMouseDown={() => {
                        setInput(s);
                        setSuggestions([]);
                        setActiveIdx(-1);
                        inputRef.current?.focus();
                      }}
                      style={{
                        minHeight: 48,
                        padding: "13px 16px",
                        fontSize: 15,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        background:
                          idx === activeIdx ? T.surfaceHover : "transparent",
                        color:
                          idx === activeIdx ? T.text.primary : T.text.secondary,
                        borderBottom:
                          idx < suggestions.length - 1
                            ? `1px solid ${T.border}`
                            : "none",
                      }}
                    >
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              style={{
                background: T.teal,
                color: T.bg,
                border: "none",
                borderRadius: 10,
                padding: "0 22px",
                height: 48,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap" as const,
                flexShrink: 0,
                letterSpacing: 0.1,
              }}
            >
              Submit
            </button>
          </form>
        </div>
      )}
    </>
  );
}
