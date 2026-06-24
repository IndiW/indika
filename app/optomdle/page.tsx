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
  // ── Neuro-ophthalmology ───────────────────────────────────────────────────
  {
    diagnosis: "Non-Arteritic Anterior Ischaemic Optic Neuropathy",
    hints: [
      "A 62-year-old man with hypertension and type 2 diabetes wakes to find the lower half of his left visual field has disappeared.",
      "The vision loss was present on waking — the patient reports no symptoms whatsoever the previous evening.",
      "There is no pain on eye movement; the eye is quiet and completely white on external examination.",
      "A relative afferent pupillary defect is present in the left eye; the optic disc appears swollen and hyperaemic with splinter haemorrhages at its inferior margin.",
      "The contralateral disc has a cup-to-disc ratio of 0.1 — a crowded 'disc at risk' configuration with no physiological cup.",
      "ESR and CRP are both within normal limits, excluding giant cell arteritis; automated perimetry confirms a dense inferior altitudinal defect.",
    ],
  },
  {
    diagnosis: "Papilloedema",
    hints: [
      "A 28-year-old obese woman presents with a six-week history of daily headaches that are worst on waking and on Valsalva manoeuvre.",
      "She describes brief episodes of graying-out of vision lasting only seconds, occurring up to four times daily and triggered by standing up quickly.",
      "Visual acuity is 20/20 in both eyes; automated perimetry reveals enlarged blind spots bilaterally with otherwise intact fields.",
      "Both optic discs show 360° margin blurring with elevation, absent spontaneous venous pulsations, and flame haemorrhages at the disc margins bilaterally.",
      "Fundus autofluorescence is negative, effectively excluding optic disc drusen as the cause of bilateral disc elevation.",
      "Lumbar puncture reveals an opening pressure of 34 cmH₂O with entirely normal CSF constituents; MRI shows an empty sella and bilateral transverse sinus stenosis.",
    ],
  },
  {
    diagnosis: "Internuclear Ophthalmoplegia",
    hints: [
      "A 31-year-old woman presents with a two-day history of horizontal double vision that is worse when looking to the right.",
      "Cover testing at distance reveals a small left esotropia that is present only in right gaze.",
      "Attempted right gaze reveals that the left eye adducts sluggishly and incompletely, while the right abducting eye shows coarse horizontal nystagmus.",
      "Convergence testing is entirely normal — both eyes adduct fully and symmetrically to a near target held at 10 cm.",
      "She recalls a similar but milder episode of monocular blurred vision 18 months ago that resolved spontaneously over six weeks.",
      "MRI of the brain reveals a demyelinating plaque within the left medial longitudinal fasciculus; oligoclonal bands are detected in the CSF.",
    ],
  },
  {
    diagnosis: "Horner Syndrome",
    hints: [
      "A 45-year-old woman is referred by her GP after noticing an asymmetry between her upper eyelids in a photograph taken at a recent event.",
      "Her right pupil measures 2 mm in bright illumination and 2.5 mm in darkness; her left pupil measures 3 mm in bright illumination and 5.5 mm in darkness — the anisocoria is greater in dim light.",
      "A right upper lid ptosis of 2 mm is noted along with an apparent elevation of the right lower lid (inverse ptosis); there is no conjunctival injection.",
      "She reports absent sweating on the right side of her face and a persistent dull ache in the right side of her neck over the same two-week period.",
      "Topical apraclonidine 0.5% instilled bilaterally reverses the anisocoria within 45 minutes, confirming postganglionic sympathetic denervation of the right iris.",
      "MRI with fat-suppression sequences reveals a right internal carotid artery dissection extending from the C2 level to the skull base.",
    ],
  },
  {
    diagnosis: "Third Nerve Palsy",
    hints: [
      "A 54-year-old man with well-controlled type 2 diabetes presents with sudden-onset binocular vertical and horizontal diplopia accompanied by severe left periorbital pain he rates 9/10.",
      "The left upper eyelid is completely ptotic; on manual elevation of the lid, the left eye is deviated downward and outward in primary position.",
      "The left pupil measures 7 mm and is completely non-reactive to both direct and consensual light stimulation.",
      "The combination of diabetes and acute onset initially raises the possibility of a microvascular palsy — but pupil involvement and the severity of the headache argue strongly against this aetiology.",
      "CT of the head is unremarkable; urgent CT angiography is performed the same afternoon.",
      "A 7 mm left posterior communicating artery aneurysm is identified at its junction with the internal carotid artery; neurosurgery is contacted immediately for clipping.",
    ],
  },
  {
    diagnosis: "Leber's Hereditary Optic Neuropathy",
    hints: [
      "A 22-year-old man presents with a two-week history of blurred central vision in his right eye; he explicitly denies any pain on eye movement.",
      "Best corrected visual acuity is 20/200 OD; colour vision is severely reduced with only 1 of 14 Ishihara plates passed.",
      "The right optic disc appears hyperaemic with peripapillary telangiectatic microangiopathy; fluorescein angiography shows no disc leakage despite the apparent swelling — pseudooedema.",
      "Six weeks later, the left eye develops identical symptoms; automated perimetry of both eyes confirms dense centrocaecal scotomas.",
      "His maternal uncle lost central vision bilaterally in his mid-twenties under near-identical circumstances; his mother and two maternal aunts are entirely asymptomatic.",
      "Mitochondrial DNA analysis identifies the m.11778G>A point mutation in the ND4 gene, confirming the diagnosis; idebenone is commenced and genetic counselling is provided.",
    ],
  },
  // ── Binocular vision ──────────────────────────────────────────────────────
  {
    diagnosis: "Convergence Insufficiency",
    hints: [
      "A 19-year-old university student presents with eyestrain, frontal headaches, and intermittent blurred vision that occur exclusively during prolonged reading and screen work.",
      "Distance vision is entirely clear and comfortable; symptoms are completely absent when watching television, driving, or looking at distant objects.",
      "Distance cover test is orthophoric; near cover test reveals a 10Δ exophoria with slow, effortful recovery and a subjective sense of strain.",
      "Near point of convergence is receded to 18 cm (normal <10 cm); base-out fusional vergence amplitudes at near are reduced, with a break at only 12Δ.",
      "Accommodation is normal for age; cycloplegic refraction reveals only trivial hyperopia (+0.50 DS), effectively excluding a primary accommodative disorder.",
      "A 12-week programme of office-based vergence and accommodative therapy normalises the NPC to 7 cm and fully resolves all symptoms.",
    ],
  },
  {
    diagnosis: "Fourth Nerve Palsy",
    hints: [
      "A 38-year-old teacher presents with vertical double vision that is most troublesome when descending stairs and when reading — tasks that require downward gaze.",
      "She has adopted a chin-down and left head-tilt posture that she reports significantly reduces the diplopia.",
      "Prism cover testing reveals a right hypertropia of 6Δ in primary position that increases in left gaze and increases further on right head tilt — Bielschowsky head tilt test is positive.",
      "Fundus examination of the right eye reveals excyclotorsion — the optic disc's superior pole is tilted temporally relative to the left eye.",
      "Old school photographs over a 10-year span confirm the head tilt has been present since childhood, indicating a congenital aetiology that has recently decompensated.",
      "Vertical fusional amplitudes are dramatically enlarged at 18Δ — a hallmark of long-standing adaptation to a congenital fourth nerve palsy; vertical prism glasses are prescribed.",
    ],
  },
  {
    diagnosis: "Decompensated Heterophoria",
    hints: [
      "A 35-year-old accountant presents with intermittent horizontal diplopia that has appeared over the past three months, occurring mainly during late afternoon and under deadline pressure.",
      "She recalls being told she had a 'tendency for her eyes to drift' at a school vision screening two decades ago but had no symptoms until now.",
      "Distance cover test reveals a 14Δ exophoria with slow, effortful recovery; near cover test shows a similar exophoria with break-and-recovery present.",
      "Fusional convergence amplitudes are reduced: break at 14Δ base-out at distance; recovery is absent on repeated testing, indicating the deviation is decompensating.",
      "Near point of convergence is normal at 6 cm; accommodation is full for age; MRI of the brain and orbits is entirely normal, excluding an acquired cranial nerve palsy.",
      "The condition is attributed to decompensation of a longstanding exophoria under increased sustained visual demand; vergence therapy is initiated with good response.",
    ],
  },
  {
    diagnosis: "Duane Retraction Syndrome",
    hints: [
      "A mother brings her 8-year-old daughter for evaluation after the school nurse observed that the child's right eye 'disappears' when she looks to the right in photographs.",
      "Despite the obvious ocular motility restriction, the child has never complained of double vision and has no head posture in primary gaze.",
      "Attempted right gaze reveals severely limited abduction of the right eye that does not cross the midline — the presentation initially raises concern for a right sixth nerve palsy.",
      "On adduction, the right globe visibly retracts into the orbit and the palpebral fissure narrows significantly; this retraction is not seen in a sixth nerve palsy.",
      "Electromyography confirms paradoxical co-innervation of the right lateral rectus by branches of the oculomotor nerve; MRI shows an absent right sixth nerve nucleus and fascicle.",
      "No intervention is planned; the absence of diplopia is explained by the co-innervation pattern preventing conflicting retinal images, and the cosmesis in primary gaze is acceptable.",
    ],
  },
  // ── Retina / vitreous ─────────────────────────────────────────────────────
  {
    diagnosis: "Central Retinal Vein Occlusion",
    hints: [
      "A 61-year-old man with poorly controlled hypertension presents with sudden painless reduction in vision in his right eye, first noticed on waking.",
      "Best corrected visual acuity is 6/60 OD; an afferent pupillary defect is equivocal on swinging flashlight testing.",
      "Fundoscopy reveals flame-shaped and dot-blot haemorrhages in all four retinal quadrants, markedly dilated and tortuous retinal veins, and a swollen optic disc.",
      "Cotton-wool spots are scattered across the posterior pole; OCT of the macula confirms extensive intraretinal fluid with marked central macular thickening.",
      "OCT angiography demonstrates loss of perifoveal capillary perfusion; blood pressure at the visit is 178/104 mmHg.",
      "Intravitreal anti-VEGF therapy is commenced for the macular oedema; urgent cardiovascular workup is initiated given the significantly elevated blood pressure.",
    ],
  },
  {
    diagnosis: "Branch Retinal Artery Occlusion",
    hints: [
      "A 67-year-old woman with known atrial fibrillation presents with sudden, painless loss of her inferior-nasal visual field in her left eye over the past two hours.",
      "Distance visual acuity is 20/20; confrontation visual field testing reveals a dense absolute defect in the inferior-nasal quadrant.",
      "A bright, refractile, yellowish plaque (Hollenhorst plaque) is visible at the bifurcation of the superior temporal arteriole on fundoscopy.",
      "A sector of retinal whitening consistent with ischaemic oedema is present in the distribution of the occluded superior temporal branch artery; the fovea appears spared.",
      "Automated perimetry confirms a dense inferior arcuate scotoma precisely corresponding to the territory of the occluded vessel.",
      "Transoesophageal echocardiography identifies a left atrial thrombus as the likely embolic source; anticoagulation is commenced immediately.",
    ],
  },
  {
    diagnosis: "Vitreomacular Traction",
    hints: [
      "A 64-year-old woman presents with a six-month history of progressive metamorphopsia and a mild reduction in central vision in her right eye.",
      "Amsler grid testing reveals central distortion; best corrected visual acuity has declined from 20/25 to 20/40 over two successive clinic visits six months apart.",
      "Fundoscopy with a 78D lens appears grossly unremarkable apart from a subtle loss of the normal foveal reflex.",
      "A few small drusen are noted at the posterior pole; fundus fluorescein angiography demonstrates no leakage and no evidence of an active choroidal neovascular membrane.",
      "Macular OCT reveals a persistent vitreous attachment at a focal 350 μm zone centred on the fovea, with elevation and tractional distortion of the foveal contour — the posterior hyaloid has not yet separated.",
      "An intravitreal injection of ocriplasmin achieves pharmacological vitreomacular separation; metamorphopsia resolves and acuity recovers to 20/25 at the three-month review.",
    ],
  },
  {
    diagnosis: "Epiretinal Membrane",
    hints: [
      "A 71-year-old man reports that straight lines appear wavy when viewed with his right eye alone — noticed when closing his left eye to thread a needle.",
      "Best corrected distance and near visual acuity are mildly reduced at 20/40 OD; the distortion has been slowly progressive over two years.",
      "Amsler grid testing confirms central metamorphopsia without any absolute scotoma.",
      "Fundoscopy reveals a subtle cellophane-like sheen at the macula with mild vascular distortion dragging vessels slightly; the foveal reflex is absent.",
      "Fundus fluorescein angiography demonstrates no leakage and no evidence of choroidal neovascularisation — the appearance is inconsistent with wet AMD.",
      "OCT reveals a thin, highly reflective layer adherent to the internal limiting membrane causing tractional distortion of the inner retinal layers with obliteration of the foveal pit.",
    ],
  },
  {
    diagnosis: "Choroidal Melanoma",
    hints: [
      "A 58-year-old man is referred after a pigmented fundus lesion is identified incidentally during a routine dilated fundus examination; he is completely asymptomatic.",
      "The lesion is located temporal to the fovea in the right eye — dome-shaped, slate-grey with orange surface pigmentation (lipofuscin deposits), measuring 11 mm in basal diameter.",
      "A dilated episcleral sentinel vessel is identified on careful slit lamp examination of the right globe.",
      "B-scan ultrasonography reveals a dome-shaped lesion with choroidal excavation, low internal reflectivity (acoustic hollowness), and a height of 3.2 mm.",
      "Automated visual field testing demonstrates a corresponding scotoma; MRI of the orbits confirms no extraocular extension.",
      "Liver function tests, CT of the chest and abdomen, and liver ultrasound are performed to stage the disease; the patient is referred to a specialist ocular oncology centre for plaque brachytherapy.",
    ],
  },
  // ── Anterior segment / cornea ─────────────────────────────────────────────
  {
    diagnosis: "Acanthamoeba Keratitis",
    hints: [
      "A 26-year-old soft contact lens wearer presents with severe right eye pain she describes as disproportionately intense relative to the modest degree of redness visible.",
      "She admits to routinely rinsing her lenses with tap water and wearing them while swimming in a lake over the preceding summer months.",
      "A course of broad-spectrum topical fluoroquinolone antibiotics prescribed by her GP over two weeks has produced no clinical improvement whatsoever.",
      "Slit lamp examination reveals anterior stromal infiltrates arranged in a partial ring pattern and faint opacities tracking along the course of corneal nerves — perineural infiltrates.",
      "Confocal microscopy of the corneal stroma demonstrates double-walled cysts with morphology characteristic of Acanthamoeba species.",
      "Intensive topical polyhexamethylene biguanide (PHMB) 0.02% and propamidine isethionate (Brolene) are commenced; the patient is informed treatment will continue for a minimum of six months.",
    ],
  },
  {
    diagnosis: "Herpes Simplex Keratitis",
    hints: [
      "A 34-year-old man presents with a three-day history of right eye redness, photophobia, and a foreign body sensation — he initially attributed it to a contact lens problem but has not worn lenses for over a year.",
      "He reports two clinically similar episodes affecting the same eye over the past four years, each resolving over several weeks without a definitive diagnosis.",
      "Slit lamp examination with fluorescein staining under cobalt-blue illumination reveals a linear branching epithelial defect with terminal end-bulbs — a classic dendritic figure.",
      "Corneal sensation assessed with a fine cotton thread is markedly reduced in the affected eye compared with the fellow eye and with expected norms.",
      "The stroma is clear in this episode; there is mild anterior chamber activity with 1+ cells and trace flare.",
      "Topical aciclovir 3% ointment five times daily is prescribed; prophylactic oral antiviral therapy is discussed given the pattern of recurrence.",
    ],
  },
  {
    diagnosis: "Fuchs' Endothelial Dystrophy",
    hints: [
      "A 57-year-old woman presents with bilateral slowly progressive blurred vision that is consistently worse in the morning and characteristically improves within two to three hours of waking.",
      "She initially attributed the morning blur to 'sleep in her eyes' but the symptom has become significantly more pronounced and predictable over the past 18 months.",
      "Distance acuity is 20/40 OD and 20/50 OS in the morning clinic slot, improving to 20/25 and 20/30 respectively when retested in the afternoon; pinhole produces no improvement.",
      "Slit lamp examination under specular illumination reveals a beaten-bronze appearance of the corneal endothelium with confluent central guttae and mild diffuse stromal thickening.",
      "Specular microscopy confirms markedly reduced endothelial cell density at 680 cells/mm² OD with grossly pleomorphic and polymegethous cells; central corneal pachymetry measures 620 μm OD.",
      "Descemet membrane endothelial keratoplasty (DMEK) is planned; the patient is counselled that cataract extraction carries significant risk of precipitating corneal decompensation.",
    ],
  },
  {
    diagnosis: "Acute Angle-Closure Glaucoma",
    hints: [
      "A 64-year-old hyperopic woman presents to the emergency department with sudden-onset severe left ocular pain, nausea, and vomiting that began two hours ago in a darkened cinema.",
      "She reports noticing coloured haloes around lights on several occasions over the preceding weeks, which she dismissed as a problem with her reading glasses prescription.",
      "The left eye shows circumcorneal ciliary flush; the cornea appears hazy and microcystic; the pupil is mid-dilated, vertically oval, and non-reactive to direct light.",
      "The left globe is rock-hard on gentle digital palpation; Van Herick slit lamp assessment of the fellow eye reveals a narrow anterior chamber angle of grade 1.",
      "IOP by Goldmann applanation tonometry measures 58 mmHg OS; gonioscopy confirms complete iridocorneal angle closure with peripheral anterior synechiae beginning to form.",
      "Intravenous acetazolamide, topical IOP-lowering agents, and pilocarpine are administered; emergency Nd:YAG laser peripheral iridotomy is performed in both eyes once corneal clarity is restored.",
    ],
  },
  // ── Glaucoma ──────────────────────────────────────────────────────────────
  {
    diagnosis: "Normal Tension Glaucoma",
    hints: [
      "A 52-year-old woman is referred after her optometrist detected an abnormal automated visual field in her right eye during a routine examination; she reports no ocular symptoms.",
      "Goldmann applanation IOP has measured between 12 and 16 mmHg at every clinic visit over two years; central corneal thickness is 545 μm bilaterally — average, offering no correction factor.",
      "Automated perimetry reveals a dense superior paracentral scotoma in the right eye extending to within 5° of fixation — a pattern more consistent with vascular than pressure-related optic nerve injury.",
      "The right optic disc shows a focal inferior notch with a disc haemorrhage at the 7 o'clock position; OCT RNFL confirms significant inferior thinning in both eyes with the right worse than the left.",
      "MRI of the brain and orbits with contrast is entirely normal, excluding a compressive lesion or demyelinating process as the underlying cause of the optic neuropathy.",
      "Ambulatory blood pressure monitoring reveals nocturnal hypotension with a dipping pattern exceeding 20%; topical prostaglandin analogue is commenced with a target IOP reduction of 30%.",
    ],
  },
  {
    diagnosis: "Pigmentary Glaucoma",
    hints: [
      "A 29-year-old myopic man presents after an acute episode of blurred vision and coloured haloes lasting 90 minutes that occurred during and immediately after a vigorous gym session.",
      "IOP measured three hours after the episode is 24 mmHg OD and 22 mmHg OS; a routine check six months prior recorded 18 mmHg bilaterally.",
      "Slit lamp examination reveals a vertical spindle-shaped brown pigment deposit on the central corneal endothelium (Krukenberg spindle) and markedly dense trabecular pigmentation on gonioscopy.",
      "Iris transillumination defects are present in a radial spoke-like pattern in the mid-peripheral iris bilaterally; UBM demonstrates a concave posterior iris bowing consistent with reverse pupillary block.",
      "Automated perimetry is currently full; however, OCT RNFL reveals borderline inferior thinning bilaterally consistent with early glaucomatous damage.",
      "Topical IOP-lowering therapy is commenced; the patient is counselled to avoid pupil-dilating activities and is warned the condition characteristically attenuates spontaneously after the fifth decade.",
    ],
  },
  {
    diagnosis: "Pseudoexfoliation Glaucoma",
    hints: [
      "A 74-year-old man is referred for cataract assessment; his right eye IOP is 32 mmHg and left eye IOP is 18 mmHg on two separate measurements.",
      "Despite maximal mydriatic drops, pupillary dilation is poor bilaterally; the zonules are visible and appear lax, with subtle phacodonesis evident on slit lamp examination.",
      "A white, flaky, dandruff-like material is visible at the pupillary ruff and as a central disc with a clear intermediate zone on the anterior lens capsule — most prominent just within the pupil margin.",
      "Gonioscopy of the right eye reveals uneven, dense pigmentation of the trabecular meshwork with a Sampaolesi line — a pigment line anterior to Schwalbe's line.",
      "Automated perimetry of the right eye reveals an early superior arcuate scotoma; OCT RNFL confirms asymmetric inferior thinning in keeping with right eye glaucoma.",
      "Cataract surgery is planned with use of a capsular tension ring given the zonular fragility; trabeculectomy is discussed given the asymmetric magnitude of IOP.",
    ],
  },
  // ── Systemic with ocular manifestation ───────────────────────────────────
  {
    diagnosis: "Giant Cell Arteritis",
    hints: [
      "A 74-year-old woman presents with a one-week history of sudden painless visual loss in her right eye reducing acuity to hand movements; she also reports a four-week history of temporal headache, scalp tenderness on brushing, and jaw pain when chewing.",
      "The right optic disc is chalk-white and swollen — a pale disc oedema rather than the hyperaemic swelling typical of non-arteritic disease; a brisk RAPD is present.",
      "The left eye is currently unaffected, but the patient reports a brief episode of transient monocular visual loss (amaurosis fugax) in the left eye yesterday lasting approximately two minutes.",
      "ESR is 112 mm/hr; CRP is 98 mg/L; platelets are elevated at 520 × 10⁹/L — the full inflammatory triad.",
      "High-dose intravenous methylprednisolone is started immediately without awaiting biopsy to protect the remaining eye; temporal artery biopsy is arranged within 48 hours.",
      "Biopsy reveals transmural granulomatous inflammation with multinucleated giant cells and disruption of the internal elastic lamina, confirming the diagnosis histologically.",
    ],
  },
  {
    diagnosis: "Thyroid Eye Disease",
    hints: [
      "A 43-year-old woman presents with a four-month history of bilateral eye redness, grittiness, and a sensation that her eyes are 'staring' — multiple friends have independently commented on a change in her facial appearance.",
      "She has a two-year history of Graves' disease, currently euthyroid on carbimazole; she is a current smoker of 15 cigarettes per day.",
      "Exophthalmometry reveals 24 mm of proptosis bilaterally (normal <20 mm); there is bilateral upper lid retraction with scleral show above the corneal limbus in primary gaze.",
      "Motility testing reveals restriction of elevation in both eyes; she reports vertical diplopia on upgaze that has progressively worsened over two months.",
      "Colour vision and contrast sensitivity are currently normal; however, pattern VEPs show borderline prolonged latency in the right eye, prompting urgent cross-sectional orbital imaging.",
      "CT/MRI of the orbits demonstrates fusiform enlargement of bilateral inferior and medial recti with tendon-sparing — the characteristic pattern of thyroid orbitopathy; intravenous methylprednisolone pulse therapy is commenced.",
    ],
  },
  {
    diagnosis: "Myasthenia Gravis",
    hints: [
      "A 47-year-old woman presents with a three-month history of intermittent drooping of the right upper eyelid that is absent in the morning but consistently pronounced by the evening.",
      "She also reports intermittent horizontal double vision that fluctuates from hour to hour and is entirely absent on some days — a pattern of variability that no fixed motility deficit can explain.",
      "Sustained upgaze for 60 seconds produces progressive worsening of the ptosis; on rapid return to primary position, the left lid momentarily overshoots upward before settling — Cogan's lid twitch sign.",
      "Application of an ice pack to the right upper lid for two minutes produces a measurable 3 mm improvement in ptosis — a positive ice pack test exploiting impaired acetylcholinesterase activity at reduced temperatures.",
      "Serum anti-acetylcholine receptor antibodies return as strongly positive; CT of the mediastinum is performed.",
      "CT reveals an anterior mediastinal mass consistent with thymoma; the patient is referred for thymectomy; pyridostigmine and prednisolone are commenced.",
    ],
  },
  // ── Uvea ──────────────────────────────────────────────────────────────────
  {
    diagnosis: "Vogt-Koyanagi-Harada Syndrome",
    hints: [
      "A 33-year-old Japanese woman presents with bilateral blurred vision and photophobia of three days duration; one week prior she experienced severe headaches, neck stiffness, tinnitus, and vertigo which she attributed to a viral illness.",
      "Both eyes show diffuse anterior uveitis with 3+ cells and flare; fundoscopy reveals bilateral disc hyperaemia and multiple serous neurosensory retinal detachments in the posterior pole.",
      "Lumbar puncture performed during the prodromal phase showed CSF pleocytosis (40 lymphocytes/mm³) with normal protein and glucose — consistent with aseptic meningitis.",
      "OCT confirms bilateral exudative subretinal fluid; FFA shows multiple hyperfluorescent pinpoints at the RPE level with late pooling into a 'milky way' pattern characteristic of multifocal RPE leakage.",
      "Three months after the initial uveitic episode, the patient develops patches of skin depigmentation on her forearms (vitiligo) and whitening of her eyelashes (poliosis).",
      "High-dose systemic corticosteroids are commenced with a slow taper over 6–12 months; HLA-DR4 typing is positive, consistent with known genetic susceptibility in this condition.",
    ],
  },
  {
    diagnosis: "Sympathetic Ophthalmia",
    hints: [
      "A 39-year-old man presents with bilateral visual disturbance, photophobia, and a dull aching pain in his left eye — an eye he states has 'never been right' since a metalworking injury nine months ago.",
      "The right eye (which sustained no injury) shows 2+ anterior chamber cells, flare, and large mutton-fat keratic precipitates; fundoscopy reveals vitritis and creamy-white chorioretinal nodules.",
      "Careful history elicits that the left eye (the injured eye) sustained a penetrating full-thickness corneal laceration that was repaired surgically; it has had chronic low-grade inflammation since.",
      "The combination of bilateral granulomatous uveitis with discrete yellow-white chorioretinal nodules (Dalen-Fuchs nodules) occurring after penetrating trauma is a pattern highly specific to this condition.",
      "Sarcoidosis, Vogt-Koyanagi-Harada syndrome, and infectious uveitis are excluded on comprehensive systemic workup; the temporal relationship to the perforating injury and bilateral granulomatous inflammation are diagnostic.",
      "High-dose oral corticosteroids and steroid-sparing immunosuppression are commenced; enucleation of the exciting (injured) eye is discussed but deferred as it retains measurable vision.",
    ],
  },
  // ── Lids / adnexa ─────────────────────────────────────────────────────────
  {
    diagnosis: "Sebaceous Cell Carcinoma",
    hints: [
      "A 69-year-old woman presents with her third recurrence of a chalazion in the same location on the right upper lid over 18 months, each previously treated with incision and curettage.",
      "The tissue surrounding the recurrent lesion shows subtle diffuse thickening of the lid margin with loss of normal eyelash architecture (madarosis) over a 10 mm segment.",
      "The superior tarsal conjunctiva of the right upper lid shows a diffuse, velvety, yellowish thickening on eversion — not replicated on the lower lid or in the left eye.",
      "The lesion does not respond to repeat curettage or intralesional steroid injection; its behaviour is inconsistent with that of a benign chalazion.",
      "Incisional biopsy with map biopsies of the conjunctival surface reveals pagetoid spread of malignant cells with foamy lipid-laden cytoplasm infiltrating the conjunctival epithelium.",
      "Wide surgical excision with frozen section margin control is performed; sentinel lymph node biopsy is discussed given the established risk of regional metastasis to preauricular and submandibular nodes.",
    ],
  },
  {
    diagnosis: "Floppy Eyelid Syndrome",
    hints: [
      "A 48-year-old obese man presents with chronic unilateral papillary conjunctivitis of the right eye that is worst on waking and has failed to respond to antihistamines, mast cell stabilisers, and three courses of topical antibiotics over two years.",
      "He reports that his right eye is consistently most irritated immediately on waking and improves gradually through the day; he sleeps predominantly on his right side.",
      "The right upper lid is markedly lax — it everts spontaneously with minimal upward traction; the tarsal plate feels rubbery and lacks its normal rigid consistency.",
      "The superior tarsal conjunctiva shows a velvety papillary reaction with mucoid discharge; punctate epithelial erosions are present on the superior cornea.",
      "His partner reports loud snoring and witnessed apnoeic episodes; referral to a sleep physician confirms obstructive sleep apnoea with an apnoea-hypopnoea index of 38 events per hour.",
      "Lid-taping during sleep and CPAP therapy produce dramatic improvement in morning symptoms; horizontal lid-tightening surgery is planned for definitive management.",
    ],
  },
  // ── Posterior scleritis ───────────────────────────────────────────────────
  {
    diagnosis: "Posterior Scleritis",
    hints: [
      "A 41-year-old woman with known rheumatoid arthritis presents with severe, deep, boring right eye pain that wakes her from sleep and is not relieved by standard oral analgesics.",
      "The anterior segment is entirely quiet with no injection, cells, or flare; IOP is normal; a diagnosis of anterior scleritis is clinically excluded.",
      "Fundoscopy reveals choroidal folds radiating from the posterior pole and a shallow exudative retinal detachment with no visible retinal break.",
      "B-scan ultrasonography demonstrates thickening of the posterior coats of the globe and fluid in Tenon's space posterior to the globe, producing the pathognomonic T-sign.",
      "MRI of the orbits confirms scleral wall thickening at the posterior pole and excludes an orbital mass lesion, metastatic choroidal disease, and uveal effusion syndrome.",
      "Oral NSAIDs and systemic corticosteroids are commenced; immunosuppression is escalated in coordination with the patient's rheumatologist given the context of her rheumatoid arthritis.",
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
  "Anterior Scleritis",
  "Posterior Scleritis",
  "Necrotising Scleritis",
  // Lids & adnexa
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
  "Vogt-Koyanagi-Harada Syndrome",
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
  "Acute Angle-Closure Glaucoma",
  "Chronic Angle-Closure Glaucoma",
  "Pigmentary Glaucoma",
  "Pseudoexfoliation Glaucoma",
  "Neovascular Glaucoma",
  "Traumatic Glaucoma",
  "Steroid-Induced Glaucoma",
  "Juvenile Open-Angle Glaucoma",
  "Congenital Glaucoma",
  // Lens
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
  "Rhegmatogenous Retinal Detachment",
  "Tractional Retinal Detachment",
  "Exudative Retinal Detachment",
  "Retinal Tear",
  "Lattice Degeneration",
  "Retinoschisis",
  "Macular Hole",
  "Epiretinal Membrane",
  "Vitreomacular Traction",
  "Non-Proliferative Diabetic Retinopathy",
  "Proliferative Diabetic Retinopathy",
  "Diabetic Macular Oedema",
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
  "Esotropia",
  "Accommodative Esotropia",
  "Intermittent Exotropia",
  "Exotropia",
  "Hypertropia",
  "Anisometropic Amblyopia",
  "Deprivation Amblyopia",
  "Strabismic Amblyopia",
  "Convergence Insufficiency",
  "Convergence Excess",
  "Divergence Insufficiency",
  "Decompensated Heterophoria",
  "Duane Retraction Syndrome",
  "Brown Syndrome",
  "Superior Oblique Myokymia",
  // Systemic with ocular manifestations
  "Thyroid Eye Disease",
  "Giant Cell Arteritis",
  "Sarcoidosis",
  "Behçet's Disease",
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
  "Globe Rupture",
  "Orbital Blowout Fracture",
  "Hyphema",
  "Angle Recession",
  "Contact Lens-Associated Red Eye",
  "Microbial Keratitis",
  "Contact Lens Papillary Conjunctivitis",
].sort();

const EPOCH_DAY = Math.floor(new Date("2026-06-01").getTime() / 86400000);

function getTodayDay(): number {
  return Math.floor(Date.now() / 86400000) - EPOCH_DAY;
}

// ── Persistence (per-day) ──────────────────────────────────────────────────

function loadSaved(day: number): string[] {
  try {
    const raw = localStorage.getItem(`optomdle-v2-${day}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persist(day: number, guesses: string[]) {
  try {
    localStorage.setItem(`optomdle-v2-${day}`, JSON.stringify(guesses));
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
  "Non-Arteritic Anterior Ischaemic Optic Neuropathy":
    "Infarction of the anterior optic nerve due to small vessel ischaemia, presenting as sudden painless altitudinal visual field loss on waking — typically in patients with a crowded 'disc at risk' and vascular risk factors.",
  "Papilloedema":
    "Bilateral optic disc swelling caused by raised intracranial pressure, distinguished by preserved visual acuity early in its course, absent spontaneous venous pulsations, and transient obscurations on postural change.",
  "Internuclear Ophthalmoplegia":
    "A horizontal gaze disorder caused by a lesion of the medial longitudinal fasciculus, producing ipsilateral adduction deficit with contralateral abducting nystagmus while convergence remains intact.",
  "Horner Syndrome":
    "Ipsilateral ptosis, miosis, and anhidrosis caused by interruption of the three-neuron oculosympathetic pathway, with anisocoria greatest in dim illumination — pharmacological testing localises the lesion level.",
  "Third Nerve Palsy":
    "Palsy of the oculomotor nerve producing ptosis, a down-and-out eye deviation, and — in compressive aetiologies — a fixed dilated pupil requiring urgent vascular imaging to exclude a posterior communicating artery aneurysm.",
  "Leber's Hereditary Optic Neuropathy":
    "A mitochondrial disorder causing bilateral sequential painless central visual loss in young men, characterised by peripapillary telangiectatic microangiopathy and centrocaecal scotomas without disc leakage on FFA.",
  "Convergence Insufficiency":
    "A binocular vision disorder characterised by a receded near point of convergence and near exophoria with reduced fusional reserves, causing asthenopia and diplopia exclusively at near — first-line treatment is vergence therapy.",
  "Fourth Nerve Palsy":
    "Palsy of the trochlear nerve causing ipsilateral superior oblique weakness, manifest as vertical and torsional diplopia maximal in contralateral gaze and on ipsilateral head tilt — confirmed by the Parks-Bielschowsky three-step test.",
  "Decompensated Heterophoria":
    "Breakdown of a pre-existing latent deviation (phoria) previously maintained by adequate fusional vergence reserves, presenting with intermittent diplopia and asthenopia that worsens under sustained visual demand or fatigue.",
  "Duane Retraction Syndrome":
    "A congenital cranial dysinnervation disorder caused by absent sixth nerve nucleus, resulting in limited abduction with globe retraction and fissure narrowing on adduction due to anomalous oculomotor co-innervation of the lateral rectus.",
  "Central Retinal Vein Occlusion":
    "Occlusion of the central retinal vein at the lamina cribrosa causing sudden vision loss with four-quadrant haemorrhages, dilated tortuous veins, disc swelling, and macular oedema — managed with intravitreal anti-VEGF.",
  "Branch Retinal Artery Occlusion":
    "Occlusion of a tributary retinal artery, typically by an embolus, causing acute sectoral visual field loss with corresponding retinal whitening — demands urgent embolic source workup and cardiovascular risk assessment.",
  "Vitreomacular Traction":
    "Persistent adhesion of the posterior vitreous to the fovea that tractionally distorts the foveal architecture, causing metamorphopsia and reduced acuity — confirmed by OCT showing a focal vitreomacular attachment without complete PVD.",
  "Epiretinal Membrane":
    "A fibrocellular proliferation on the inner retinal surface causing wrinkling of the macula, metamorphopsia, and mild visual loss — distinguished from neovascular AMD by absent leakage on FFA and a surface membrane on OCT.",
  "Choroidal Melanoma":
    "The most common primary intraocular malignancy in adults, presenting as a pigmented dome-shaped choroidal mass with orange lipofuscin, acoustic hollowness on B-scan, and metastatic potential — treated with plaque brachytherapy.",
  "Acanthamoeba Keratitis":
    "A sight-threatening protozoal corneal infection associated with contact lens use and water exposure, characterised by severe pain disproportionate to clinical signs, perineural infiltrates, and resistance to broad-spectrum antibiotics.",
  "Herpes Simplex Keratitis":
    "Recurrent corneal infection by herpes simplex virus causing a dendritic epithelial ulcer with terminal bulbs, reduced corneal sensation, and risk of progressive stromal scarring with repeated episodes — treated with topical antivirals.",
  "Fuchs' Endothelial Dystrophy":
    "A bilateral progressive corneal endothelial dystrophy characterised by guttae formation, endothelial cell loss, and corneal oedema that is worst in the morning and improves through the day as epithelial fluid evaporates.",
  "Acute Angle-Closure Glaucoma":
    "An ophthalmic emergency caused by sudden iridocorneal angle closure, precipitating a rapid IOP rise with severe ocular pain, nausea, haloes, corneal oedema, and a mid-dilated non-reactive pupil.",
  "Normal Tension Glaucoma":
    "Glaucomatous optic neuropathy with characteristic field loss and RNFL thinning despite IOP consistently within the statistically normal range — associated with nocturnal hypotension and requiring exclusion of compressive optic neuropathy.",
  "Pigmentary Glaucoma":
    "A glaucoma subtype in young myopic men caused by liberation of iris pigment into the anterior segment, depositing on the trabecular meshwork (Krukenberg spindle), causing exercise-induced IOP spikes and early glaucomatous damage.",
  "Pseudoexfoliation Glaucoma":
    "Glaucoma secondary to exfoliative material obstructing the trabecular meshwork, characterised by highly asymmetric IOP, zonular instability, poor mydriasis, and a higher rate of glaucoma progression than primary open-angle glaucoma.",
  "Giant Cell Arteritis":
    "A granulomatous large-vessel vasculitis of the elderly causing arteritic anterior ischaemic optic neuropathy — recognised by jaw claudication, scalp tenderness, dramatically elevated ESR/CRP, and pale disc swelling on fundoscopy.",
  "Thyroid Eye Disease":
    "An autoimmune orbitopathy associated with thyroid dysfunction causing proptosis, lid retraction, restrictive myopathy of the inferior and medial recti, and — in severe cases — compressive optic neuropathy requiring urgent treatment.",
  "Myasthenia Gravis":
    "An autoimmune neuromuscular junction disorder causing fatigable ptosis and variable diplopia, confirmed by positive ice pack test, anti-AChR antibodies, and improvement with acetylcholinesterase inhibitors — associated with thymoma.",
  "Vogt-Koyanagi-Harada Syndrome":
    "A bilateral granulomatous panuveitis from autoimmune attack on melanocytes, characterised by a prodrome of meningismus and dysacusis followed by uveitis with exudative detachments, and later vitiligo and poliosis.",
  "Sympathetic Ophthalmia":
    "A bilateral granulomatous uveitis occurring weeks to years after penetrating ocular trauma, where sensitisation to uveal antigens in the injured eye triggers granulomatous inflammation in the fellow (sympathising) eye.",
  "Sebaceous Cell Carcinoma":
    "A malignant eyelid tumour arising from meibomian or Zeis glands, notorious for masquerading as recurrent chalazion or chronic blepharitis (masquerade syndrome), with pagetoid conjunctival spread and systemic metastatic risk.",
  "Floppy Eyelid Syndrome":
    "A condition of lax, spontaneously everted upper lids — typically in obese men with obstructive sleep apnoea — causing chronic papillary conjunctivitis on the superior tarsal plate from nocturnal lid eversion against the pillow.",
  "Posterior Scleritis":
    "Inflammation of the posterior sclera causing severe boring ocular pain, choroidal folds, exudative retinal detachment, and the pathognomonic T-sign on B-scan ultrasound — commonly associated with rheumatoid arthritis.",
  // Legacy definitions retained for fallback
  "Optic Neuritis":
    "Inflammatory demyelination of the optic nerve causing acute painful visual loss, strongly associated with multiple sclerosis.",
  "Central Serous Retinopathy":
    "Accumulation of subretinal fluid beneath the macula, typically in young men under stress, causing metamorphopsia and micropsia.",
  "Corneal Abrasion":
    "A superficial defect in the corneal epithelium caused by trauma, producing acute pain, tearing, and photophobia.",
  "Anterior Uveitis":
    "Inflammation of the anterior uveal tract presenting with pain, photophobia, and a hypopyon in severe cases.",
  "Keratoconus":
    "A progressive ectatic condition in which the cornea thins and steepens into a cone shape, inducing irregular astigmatism.",
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
  const [viewingDay, setViewingDay] = useState<number>(dayNumber);

  const daily = useMemo(
    () => CASES[viewingDay % CASES.length],
    [viewingDay],
  );

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

  const isArchive = viewingDay !== dayNumber;

  // Initial hydration
  useEffect(() => {
    setGuesses(loadSaved(dayNumber));
    setUserStats(loadStats());
    setHydrated(true);
    if (!localStorage.getItem("optomdle-seen")) setShowHowToPlay(true);
  }, [dayNumber]);

  // Countdown to midnight
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

  // Mount / day-change effect — replay existing cards
  useEffect(() => {
    if (!hydrated || mountedRef.current) return;
    mountedRef.current = true;
    prevHintsRef.current = hintsRevealed;
    for (let i = 0; i < hintsRevealed; i++) flipCard(i, i * 380);
    if (gameOver && hintsRevealed > 0) {
      setTimeout(() => setShowModal(true), (hintsRevealed - 1) * 380 + 800);
    }
  }, [hydrated, hintsRevealed, gameOver, flipCard, viewingDay]);

  // Flip new cards as hints unlock
  useEffect(() => {
    if (!hydrated || !mountedRef.current) return;
    if (hintsRevealed > prevHintsRef.current) {
      const start = prevHintsRef.current;
      const baseDelay = wrongGuessFlashRef.current ? 580 : 60;
      wrongGuessFlashRef.current = false;
      for (let i = start; i < hintsRevealed; i++) {
        flipCard(i, (i - start) * 200 + baseDelay);
      }
      prevHintsRef.current = hintsRevealed;
    }
  }, [hintsRevealed, hydrated, flipCard]);

  // Autocomplete suggestions
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

  // Navigate to a different day
  const goToDay = useCallback(
    (day: number) => {
      if (day < 0 || day > dayNumber) return;
      mountedRef.current = false;
      prevHintsRef.current = 0;
      wrongGuessFlashRef.current = false;
      const saved = loadSaved(day);
      setViewingDay(day);
      setGuesses(saved);
      setCardRevealed(Array(6).fill(false));
      setCardAnimating(Array(6).fill(false));
      setFlashingCardIdx(-1);
      setInput("");
      setSuggestions([]);
      setShowModal(false);
      setShowConfetti(false);
      setStatusMsg("");
    },
    [dayNumber],
  );

  const submit = () => {
    if (gameOver || !input.trim()) return;
    const trimmed = input.trim();
    const correct = trimmed.toLowerCase() === daily.diagnosis.toLowerCase();
    const next = [...guesses, trimmed];
    setGuesses(next);
    persist(viewingDay, next);
    setInput("");
    setSuggestions([]);
    setActiveIdx(-1);
    if (correct) {
      if (!isArchive) {
        const stats = recordGame(dayNumber, true);
        setUserStats(stats);
      }
      setShowConfetti(true);
      setTimeout(() => setShowModal(true), 800);
    } else {
      const newWrong = wrongGuesses.length + 1;
      wrongGuessFlashRef.current = true;
      setFlashingCardIdx(hintsRevealed - 1);
      setTimeout(() => setFlashingCardIdx(-1), 560);
      if (newWrong < 6) {
        setStatusMsg(`Incorrect — hint ${newWrong + 1} unlocked`);
        setTimeout(() => setStatusMsg(""), 2200);
      } else {
        if (!isArchive) {
          const stats = recordGame(dayNumber, false);
          setUserStats(stats);
        }
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
    const archiveTag = isArchive ? ` (Day ${viewingDay + 1})` : "";
    return `Optomdle #${viewingDay + 1}${archiveTag} ${score}\n\n${rows}\n\nhttps://indika.dev/optomdle`;
  };

  const copyShare = () => {
    navigator.clipboard.writeText(emojiCard()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!hydrated) return null;

  const label = perfLabel(guesses.length, won);
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
            left: 0,
            right: 0,
            zIndex: 150,
            display: "flex",
            justifyContent: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
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
              animation: "optom-fadein 0.18s ease both",
            }}
          >
            {statusMsg}
          </div>
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

            {/* Archive badge */}
            {isArchive && (
              <div
                style={{
                  textAlign: "center",
                  marginBottom: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase" as const,
                    color: T.text.muted,
                    background: T.surface,
                    border: `1px solid ${T.border}`,
                    borderRadius: 100,
                    padding: "4px 12px",
                  }}
                >
                  Archive · Problem #{viewingDay + 1}
                </span>
              </div>
            )}

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

            {/* Stats grid — today only */}
            {!isArchive && (
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
            )}

            {/* Countdown (today) or Return to today (archive) */}
            {!isArchive ? (
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
            ) : (
              <div
                style={{ textAlign: "center", marginBottom: 24 }}
              >
                <button
                  onClick={() => {
                    goToDay(dayNumber);
                    setShowModal(false);
                  }}
                  style={{
                    background: "transparent",
                    color: T.teal,
                    border: `1px solid ${T.tealBorder}`,
                    borderRadius: 10,
                    padding: "10px 24px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    letterSpacing: 0.1,
                  }}
                >
                  Today&apos;s Case →
                </button>
              </div>
            )}

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
        {/* Header with archive navigation */}
        <div
          style={{
            padding: "18px 20px 12px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Prev problem button */}
          <button
            onClick={() => goToDay(viewingDay - 1)}
            disabled={viewingDay <= 0}
            aria-label="Previous problem"
            style={{
              background: "none",
              border: "none",
              cursor: viewingDay <= 0 ? "default" : "pointer",
              padding: "6px 10px",
              fontFamily: "inherit",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              gap: 2,
              minWidth: 64,
              opacity: viewingDay <= 0 ? 0.25 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontSize: 18, color: T.text.secondary, lineHeight: 1 }}>←</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: T.text.muted,
              }}
            >
              Prev
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                fontWeight: 600,
                color: viewingDay <= 0 ? T.text.dim : T.teal,
                letterSpacing: 0.2,
              }}
            >
              {viewingDay > 0 ? `#${viewingDay}` : "—"}
            </span>
          </button>

          {/* Title block */}
          <div style={{ textAlign: "center", flex: 1 }}>
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
                color: isArchive ? T.teal : T.text.muted,
                margin: 0,
                letterSpacing: "0.07em",
                textTransform: "uppercase" as const,
                fontWeight: 500,
              }}
            >
              {isArchive
                ? `Archive · Problem #${viewingDay + 1}`
                : `Problem #${dayNumber + 1}`}
            </p>
          </div>

          {/* Next problem button */}
          <button
            onClick={() => goToDay(viewingDay + 1)}
            disabled={viewingDay >= dayNumber}
            aria-label="Next problem"
            style={{
              background: "none",
              border: "none",
              cursor: viewingDay >= dayNumber ? "default" : "pointer",
              padding: "6px 10px",
              fontFamily: "inherit",
              flexShrink: 0,
              display: "flex",
              flexDirection: "column" as const,
              alignItems: "center",
              gap: 2,
              minWidth: 64,
              opacity: viewingDay >= dayNumber ? 0.25 : 1,
              transition: "opacity 0.15s",
            }}
          >
            <span style={{ fontSize: 18, color: T.text.secondary, lineHeight: 1 }}>→</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase" as const,
                color: T.text.muted,
              }}
            >
              Next
            </span>
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                fontWeight: 600,
                color: viewingDay >= dayNumber ? T.text.dim : T.teal,
                letterSpacing: 0.2,
              }}
            >
              {viewingDay < dayNumber ? `#${viewingDay + 2}` : "—"}
            </span>
          </button>
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
