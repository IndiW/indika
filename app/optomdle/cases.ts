export type Case = {
  diagnosis: string;
  hints: [string, string, string, string, string, string];
};

export const CASES: Case[] = [
  // ── Neuro-ophthalmology ───────────────────────────────────────────────────
  {
    diagnosis: "Non-Arteritic Anterior Ischaemic Optic Neuropathy",
    hints: [
      "A patient wakes up to find something is wrong with their vision — an overnight change they cannot explain.",
      "The vision loss is painless and was absent the evening before; the patient is in their sixties with a background of cardiovascular risk factors.",
      "The eye appears white and quiet on external examination; there is no pain with eye movement; a relative afferent pupillary defect is detected.",
      "The optic disc on the affected side is swollen and hyperaemic with splinter haemorrhages; the visual field loss respects the horizontal midline.",
      "The fellow optic disc is strikingly small with a cup-to-disc ratio of 0.1 and no visible physiological cup — a crowded 'disc at risk'.",
      "Inflammatory markers (ESR and CRP) are both within normal limits, effectively excluding giant cell arteritis; automated perimetry confirms a dense inferior altitudinal defect.",
    ],
  },
  {
    diagnosis: "Papilloedema",
    hints: [
      "A young adult presents with a several-week history of persistent headaches that seem to be getting worse.",
      "The headaches are worst on waking and on straining; the patient also reports brief episodes of vision going grey lasting only a few seconds.",
      "Visual acuity is preserved in both eyes; automated perimetry reveals only enlarged blind spots bilaterally with otherwise intact fields.",
      "Both optic discs are elevated with blurred margins all around, absent spontaneous venous pulsations, and flame haemorrhages — changes that are identical in both eyes.",
      "Fundus autofluorescence is negative, effectively excluding optic disc drusen; MRI shows an empty sella and bilateral transverse sinus stenosis.",
      "Lumbar puncture reveals a markedly elevated opening pressure of 34 cmH₂O with entirely normal CSF protein, glucose, and cell count.",
    ],
  },
  {
    diagnosis: "Internuclear Ophthalmoplegia",
    hints: [
      "A young adult develops double vision over the course of a couple of days.",
      "The diplopia is horizontal and worsens when looking in a particular direction; it has appeared suddenly without a clear precipitant.",
      "Cover testing reveals a small misalignment present only in lateral gaze; there is no ptosis and no pupil abnormality.",
      "One eye fails to adduct fully during lateral gaze while the fellow abducting eye shows coarse horizontal nystagmus — yet both eyes converge normally to a near target.",
      "The patient recalls an episode of monocular visual blurring 18 months earlier that resolved spontaneously over several weeks without a definitive diagnosis.",
      "MRI demonstrates a demyelinating plaque within the medial longitudinal fasciculus; oligoclonal bands are present in the CSF.",
    ],
  },
  {
    diagnosis: "Horner Syndrome",
    hints: [
      "A middle-aged patient is told their eyes look uneven — something they had not noticed themselves.",
      "On closer inspection there is a subtle droop of one upper eyelid and the pupils appear different sizes; the asymmetry is more obvious in dim lighting.",
      "The anisocoria is greater in darkness than in bright light; the smaller pupil is on the same side as the ptosis, and there is an apparent elevation of the lower lid on that same side.",
      "The patient reports a dull ache on the same side of the neck and absence of sweating on that side of the face — both present over the same two-week period.",
      "Topical apraclonidine instilled bilaterally reverses the anisocoria, confirming interruption of the oculosympathetic pathway; the lesion is localised to the postganglionic neuron.",
      "MRI with fat-suppression sequences reveals an internal carotid artery dissection on the affected side, extending from the C2 level to the skull base.",
    ],
  },
  {
    diagnosis: "Third Nerve Palsy",
    hints: [
      "A patient develops sudden-onset double vision accompanied by severe pain around one eye.",
      "On examination, one upper eyelid is completely drooped; when the lid is manually lifted, the eye appears to point in an abnormal direction.",
      "The pupil on the affected side is widely dilated and completely non-reactive to direct or consensual light; the periorbital pain is severe.",
      "The eye is deviated downward and outward with severely restricted movement in all directions — complete ptosis, ophthalmoplegia, and a fixed dilated pupil point to a single cranial nerve.",
      "A microvascular aetiology is considered given the patient's background, but pupil involvement and severity of pain make this unlikely; CT head is unremarkable.",
      "CT angiography identifies a posterior communicating artery aneurysm at its junction with the internal carotid artery; neurosurgery is contacted immediately.",
    ],
  },
  {
    diagnosis: "Leber's Hereditary Optic Neuropathy",
    hints: [
      "A young man notices blurred central vision in one eye that has come on over the past couple of weeks.",
      "The visual loss is painless — there is no pain on eye movement; central and colour vision are both severely reduced in the affected eye.",
      "The optic disc on the affected side looks swollen and hyperaemic, but fluorescein angiography shows no leakage — a pseudooedema appearance.",
      "Several weeks later the fellow eye develops identical symptoms; visual field testing of both eyes reveals dense central scotomas.",
      "A maternal uncle experienced bilateral central visual loss in his mid-twenties under nearly identical circumstances; the patient's mother and maternal aunts are entirely asymptomatic.",
      "Mitochondrial DNA analysis identifies the m.11778G>A point mutation in the ND4 gene; idebenone is commenced and genetic counselling is provided.",
    ],
  },
  // ── Binocular vision ──────────────────────────────────────────────────────
  {
    diagnosis: "Convergence Insufficiency",
    hints: [
      "A student presents with headaches and eye strain that have been getting in the way of their studies.",
      "The symptoms occur only during close work such as reading or screen use — distance vision is entirely clear and comfortable.",
      "Distance fixation is well-aligned; a latent outward deviation is detected on cover testing at near, with slow and effortful recovery.",
      "The near point of convergence is receded well beyond the normal range; base-out fusional vergence amplitudes at near are reduced.",
      "Accommodation is normal for age; cycloplegic refraction reveals only trivial hyperopia, effectively excluding a primary accommodative disorder.",
      "A structured programme of office-based vergence therapy normalises the near point of convergence and fully resolves all symptoms within 12 weeks.",
    ],
  },
  {
    diagnosis: "Fourth Nerve Palsy",
    hints: [
      "A patient complains of double vision that is particularly bothersome when going down stairs and when reading.",
      "The diplopia is vertical; the patient has adopted a subtle head posture they find helps reduce the double vision.",
      "A vertical misalignment is present on cover testing; the hypertropia increases in contralateral gaze and increases further on ipsilateral head tilt — a specific three-step pattern.",
      "Fundus examination reveals excyclotorsion of the affected eye — the optic disc's superior pole is tilted temporally compared with the fellow eye.",
      "Review of old photographs spanning a decade reveals the compensatory head tilt has been present since childhood, suggesting a congenital aetiology that has recently decompensated.",
      "Vertical fusional amplitudes are dramatically enlarged — a hallmark of long-standing adaptation; vertical prism spectacles are prescribed for symptomatic relief.",
    ],
  },
  {
    diagnosis: "Decompensated Heterophoria",
    hints: [
      "A working adult develops intermittent double vision that has appeared over the past few months.",
      "The diplopia is worse at the end of the day and during periods of sustained concentration; the patient vaguely recalls being told about an eye alignment issue at a childhood screen.",
      "A latent outward deviation is revealed on cover testing at both distance and near, with slow and effortful recovery on each occasion.",
      "Fusional convergence amplitudes are reduced and deteriorate on repeated testing — the deviation is actively decompensating.",
      "The near point of convergence is normal; accommodation is full for age; neuroimaging is entirely normal, excluding an acquired cranial nerve palsy.",
      "The condition is attributed to decompensation of a longstanding latent deviation under increased sustained visual demand; vergence therapy produces a good response.",
    ],
  },
  {
    diagnosis: "Duane Retraction Syndrome",
    hints: [
      "A child is brought to clinic after a family member noticed something unusual about one eye in photographs.",
      "Despite an obvious restriction in eye movement, the child has never experienced double vision and holds their head straight in primary gaze.",
      "The affected eye cannot abduct past the midline — a finding that superficially resembles a sixth nerve palsy.",
      "On attempted adduction, the globe visibly retracts into the orbit and the palpebral fissure narrows — a feature that clearly distinguishes this from a sixth nerve palsy.",
      "MRI shows an absent sixth nerve nucleus and fascicle on the affected side; EMG confirms paradoxical co-innervation of the lateral rectus by oculomotor nerve branches.",
      "No surgical intervention is planned; the absence of diplopia is explained by the anomalous co-innervation pattern, and the appearance in primary gaze is acceptable.",
    ],
  },
  // ── Retina / vitreous ─────────────────────────────────────────────────────
  {
    diagnosis: "Central Retinal Vein Occlusion",
    hints: [
      "A patient wakes to find the vision in one eye has suddenly and painlessly reduced.",
      "The patient has a background of poorly controlled blood pressure; visual acuity is markedly reduced and the onset was overnight.",
      "Fundoscopy reveals haemorrhages scattered across all four retinal quadrants alongside dilated, tortuous veins and a swollen disc.",
      "Cotton-wool spots are present at the posterior pole; OCT confirms extensive intraretinal fluid with marked central macular thickening.",
      "OCT angiography demonstrates loss of perifoveal capillary perfusion; blood pressure at the visit measures 178/104 mmHg.",
      "Intravitreal anti-VEGF injections are commenced for the macular oedema; urgent cardiovascular workup is arranged.",
    ],
  },
  {
    diagnosis: "Branch Retinal Artery Occlusion",
    hints: [
      "A patient notices a sudden, painless change to part of their visual field in one eye.",
      "Central visual acuity is preserved; confrontation testing reveals a dense absolute defect confined to one quadrant.",
      "A bright refractile yellowish plaque is visible at an arteriolar bifurcation on fundoscopy.",
      "A wedge-shaped area of retinal whitening is present in the distribution of a single branch artery; the fovea is spared.",
      "Automated perimetry confirms the field defect corresponds precisely to the territory of the affected vessel; the patient has known atrial fibrillation.",
      "Transoesophageal echocardiography identifies a left atrial thrombus as the likely embolic source; anticoagulation is commenced immediately.",
    ],
  },
  {
    diagnosis: "Vitreomacular Traction",
    hints: [
      "An older patient notices that straight lines appear distorted when looking with one eye.",
      "The distortion has been slowly progressive over several months; central visual acuity has declined on serial testing.",
      "Fundoscopy is largely unremarkable apart from a subtle loss of the normal foveal reflex; Amsler grid testing confirms the metamorphopsia is central.",
      "A few small drusen are noted; fluorescein angiography shows no leakage and no evidence of choroidal neovascularisation.",
      "OCT reveals a focal persistent vitreous attachment centred on the fovea over a 350 μm zone, causing tractional elevation and distortion of the foveal contour.",
      "An intravitreal injection of ocriplasmin achieves pharmacological vitreomacular separation; metamorphopsia resolves and acuity recovers to 20/25 at three months.",
    ],
  },
  {
    diagnosis: "Epiretinal Membrane",
    hints: [
      "A patient notices that straight lines appear slightly wavy when looking with one eye alone.",
      "The distortion has been present and slowly worsening over two years; central visual acuity is mildly reduced with no improvement on pinhole.",
      "Amsler grid testing confirms central metamorphopsia without any absolute scotoma.",
      "Fundoscopy reveals a subtle cellophane-like sheen at the macula with mild vascular distortion and an absent foveal reflex.",
      "Fluorescein angiography shows no leakage and no choroidal neovascularisation — the appearance is inconsistent with wet AMD.",
      "OCT reveals a thin highly reflective layer adherent to the inner retinal surface causing tractional distortion and obliteration of the foveal pit.",
    ],
  },
  {
    diagnosis: "Choroidal Melanoma",
    hints: [
      "A pigmented lesion is found in the back of the eye during a routine dilated examination; the patient is entirely asymptomatic.",
      "The lesion is dome-shaped with slate-grey colouration and orange surface pigmentation, located in the posterior pole; it measures over 10 mm at its base.",
      "A dilated episcleral sentinel vessel is identified on careful slit lamp examination of the globe.",
      "B-scan ultrasonography reveals choroidal excavation, acoustic hollowness (low internal reflectivity), and a lesion height of 3.2 mm.",
      "Visual field testing demonstrates a scotoma corresponding to the lesion; MRI confirms no extraocular extension.",
      "Staging investigations including CT chest and abdomen are performed; the patient is referred to an ocular oncology centre for plaque brachytherapy.",
    ],
  },
  // ── Anterior segment / cornea ─────────────────────────────────────────────
  {
    diagnosis: "Acanthamoeba Keratitis",
    hints: [
      "A contact lens wearer presents with a severely painful red eye.",
      "The pain feels out of proportion to how the eye looks; the patient has had water-related contact lens exposure in the preceding months.",
      "A full course of broad-spectrum topical antibiotics has produced no improvement whatsoever.",
      "Slit lamp examination reveals anterior stromal infiltrates in a partial ring pattern and opacities tracking along corneal nerve fibres — perineural infiltrates.",
      "Confocal microscopy of the corneal stroma identifies double-walled cysts with morphology characteristic of a free-living protozoan.",
      "Intensive topical PHMB 0.02% and propamidine isethionate are commenced; the patient is counselled that treatment will continue for a minimum of six months.",
    ],
  },
  {
    diagnosis: "Herpes Simplex Keratitis",
    hints: [
      "A patient presents with a red, uncomfortable eye with a foreign body sensation.",
      "This is the third similar episode affecting the same eye over four years; each previous episode resolved over weeks without a firm diagnosis.",
      "Fluorescein staining under cobalt-blue illumination reveals a branching epithelial defect with terminal end-bulbs — a dendritic figure.",
      "Corneal sensation is markedly reduced in the affected eye compared to the fellow eye.",
      "The corneal stroma is clear in this episode; there is mild anterior chamber activity with 1+ cells and trace flare.",
      "Topical aciclovir 3% ointment is prescribed; prophylactic oral antiviral therapy is discussed given the recurrent pattern.",
    ],
  },
  {
    diagnosis: "Fuchs' Endothelial Dystrophy",
    hints: [
      "A patient reports blurred vision that is noticeably worse first thing in the morning and tends to improve as the day goes on.",
      "Both eyes are affected; the pattern has become more pronounced and predictable over the past 18 months.",
      "Visual acuity measured in the morning is worse than when retested in the afternoon; pinhole produces no improvement — the blur is not refractive.",
      "Slit lamp examination under specular illumination reveals a beaten-bronze appearance of the corneal endothelium with confluent central guttae and stromal thickening.",
      "Specular microscopy confirms severely reduced endothelial cell density with grossly pleomorphic and polymegethous cells; pachymetry confirms corneal thickening.",
      "DMEK is planned; the patient is counselled that cataract surgery carries significant risk of precipitating corneal decompensation.",
    ],
  },
  {
    diagnosis: "Acute Angle-Closure Glaucoma",
    hints: [
      "A patient presents to the emergency department with sudden-onset severe eye pain accompanied by nausea and vomiting.",
      "The patient recalls intermittent coloured haloes around lights over the preceding weeks, dismissed as a prescription issue; the current episode began in a dark environment.",
      "The affected eye shows circumcorneal flush and a hazy, microcystic cornea; the pupil is mid-dilated, vertically oval, and non-reactive.",
      "The globe feels rock-hard on gentle digital palpation; the fellow eye has a grade 1 narrow anterior chamber angle on Van Herick assessment.",
      "IOP measures 58 mmHg on Goldmann applanation; gonioscopy confirms complete angle closure with early peripheral anterior synechiae forming.",
      "IV acetazolamide, topical IOP-lowering agents, and pilocarpine are administered; emergency laser peripheral iridotomy is performed in both eyes once corneal clarity is restored.",
    ],
  },
  // ── Glaucoma ──────────────────────────────────────────────────────────────
  {
    diagnosis: "Normal Tension Glaucoma",
    hints: [
      "An incidental visual field abnormality is detected during a routine examination in an asymptomatic patient.",
      "Intraocular pressure has consistently measured within the statistically normal range on multiple visits; corneal thickness is average.",
      "Automated perimetry reveals a dense paracentral scotoma approaching fixation — a pattern more suggestive of a vascular mechanism than pressure-related damage.",
      "The optic disc shows a focal inferior notch and a disc haemorrhage; OCT RNFL confirms significant inferior thinning, worse in the affected eye.",
      "MRI with contrast is entirely normal, excluding a compressive lesion or demyelinating process as the underlying cause.",
      "Ambulatory blood pressure monitoring reveals nocturnal hypotension with a dipping pattern exceeding 20%; a prostaglandin analogue is commenced targeting a 30% IOP reduction.",
    ],
  },
  {
    diagnosis: "Pigmentary Glaucoma",
    hints: [
      "A young myopic man presents with an episode of blurred vision and coloured haloes that came on during vigorous exercise.",
      "Intraocular pressure measured hours after the episode is elevated compared to a normal reading taken six months earlier.",
      "A vertical spindle-shaped brown pigment deposit is present on the central corneal endothelium, and the trabecular meshwork shows markedly dense pigmentation on gonioscopy.",
      "Radial spoke-like iris transillumination defects are present bilaterally; UBM demonstrates concave posterior iris bowing consistent with reverse pupillary block.",
      "Visual fields are currently full, but OCT RNFL shows borderline inferior thinning bilaterally consistent with early structural damage.",
      "IOP-lowering therapy is commenced; the patient is counselled that the condition characteristically attenuates after the fifth decade.",
    ],
  },
  {
    diagnosis: "Pseudoexfoliation Glaucoma",
    hints: [
      "An older man is referred for cataract assessment and found to have a markedly elevated intraocular pressure in one eye.",
      "Pupillary dilation is poor despite maximal mydriatics; the zonules appear lax and subtle lens wobble is noted on slit lamp examination.",
      "A white flaky material is present at the pupillary ruff and on the anterior lens capsule in a characteristic central disc pattern with a clear intermediate zone.",
      "Gonioscopy of the high-pressure eye reveals dense, uneven trabecular pigmentation and a Sampaolesi line — a pigment line anterior to Schwalbe's line.",
      "Perimetry reveals an early superior arcuate scotoma in the affected eye; OCT RNFL confirms asymmetric inferior thinning consistent with glaucomatous damage.",
      "Cataract surgery is planned with a capsular tension ring to manage zonular fragility; surgical IOP-lowering is discussed given the asymmetric pressure magnitude.",
    ],
  },
  // ── Systemic with ocular manifestation ───────────────────────────────────
  {
    diagnosis: "Giant Cell Arteritis",
    hints: [
      "An elderly patient presents with sudden painless loss of vision in one eye.",
      "On further questioning, the patient reports weeks of headache, scalp tenderness when brushing hair, and jaw pain on chewing.",
      "The optic disc on the affected side is chalk-white and swollen — pale disc oedema rather than the hyperaemic swelling of non-arteritic disease; a brisk RAPD is present.",
      "The patient also reports a brief episode of transient visual loss in the fellow eye the previous day; ESR and CRP are markedly elevated with thrombocytosis.",
      "High-dose IV methylprednisolone is started immediately without waiting for biopsy, to protect the remaining eye; temporal artery biopsy is arranged within 48 hours.",
      "Biopsy reveals transmural granulomatous inflammation with multinucleated giant cells and disruption of the internal elastic lamina.",
    ],
  },
  {
    diagnosis: "Thyroid Eye Disease",
    hints: [
      "A patient presents with bilateral eye redness, grittiness, and comments from friends that their eyes look different.",
      "The patient has a background of thyroid disease and is a current smoker; they report a sensation that their eyes are 'staring'.",
      "Proptosis is measured at 24 mm bilaterally — above the normal upper limit; bilateral upper lid retraction is present with scleral show above the limbus.",
      "Motility testing reveals restriction of elevation in both eyes with progressive vertical diplopia on upgaze worsening over two months.",
      "Colour vision and contrast sensitivity are currently normal; pattern VEPs show borderline prolonged latency, prompting urgent orbital imaging.",
      "MRI demonstrates fusiform enlargement of the inferior and medial recti with tendon-sparing bilaterally — the characteristic pattern; IV methylprednisolone pulse therapy is commenced.",
    ],
  },
  {
    diagnosis: "Myasthenia Gravis",
    hints: [
      "A patient presents with intermittent drooping of one upper eyelid that varies throughout the day.",
      "The ptosis is absent in the morning and consistently worst by evening; the patient also reports double vision that fluctuates hour to hour and is absent on some days entirely.",
      "Sustained upgaze progressively worsens the ptosis; on return to primary position, the opposite lid briefly overshoots upward before settling — Cogan's lid twitch sign.",
      "Applying an ice pack to the drooping lid for two minutes produces a measurable improvement in ptosis — a positive ice pack test.",
      "Serum anti-acetylcholine receptor antibodies are strongly positive; CT of the mediastinum is performed.",
      "CT reveals an anterior mediastinal mass consistent with thymoma; the patient is referred for thymectomy; pyridostigmine and prednisolone are commenced.",
    ],
  },
  // ── Uvea ──────────────────────────────────────────────────────────────────
  {
    diagnosis: "Vogt-Koyanagi-Harada Syndrome",
    hints: [
      "A patient presents with bilateral blurred vision and photophobia; a week earlier they had a severe headache, neck stiffness, tinnitus, and vertigo they attributed to a viral illness.",
      "Both eyes show significant anterior uveitis; fundoscopy reveals disc hyperaemia and multiple serous retinal detachments at the posterior pole bilaterally.",
      "Lumbar puncture from the prodromal phase showed a lymphocytic pleocytosis with normal protein and glucose — consistent with aseptic meningitis.",
      "OCT confirms bilateral exudative subretinal fluid; FFA shows multifocal hyperfluorescent pinpoints at the RPE with late pooling in a 'milky way' pattern.",
      "Months after the initial uveitic episode, patches of skin depigmentation (vitiligo) and whitening of the eyelashes (poliosis) develop.",
      "High-dose systemic corticosteroids are commenced with a slow taper over 6–12 months; HLA-DR4 typing is positive.",
    ],
  },
  {
    diagnosis: "Sympathetic Ophthalmia",
    hints: [
      "A patient develops visual disturbance and photophobia — in an eye that was never injured.",
      "The other eye sustained a penetrating injury months earlier and has had chronic low-grade inflammation since; now the uninjured eye is inflamed.",
      "The uninjured eye shows granulomatous anterior uveitis with mutton-fat keratic precipitates; fundoscopy reveals vitritis and creamy-white chorioretinal nodules.",
      "The combination of bilateral granulomatous uveitis with discrete chorioretinal nodules (Dalen-Fuchs nodules) following penetrating trauma is a pattern highly specific to this condition.",
      "Sarcoidosis, VKH syndrome, and infectious uveitis are excluded on comprehensive systemic workup; the temporal relationship to the perforating injury is diagnostic.",
      "High-dose systemic corticosteroids and steroid-sparing immunosuppression are commenced; enucleation of the injured eye is discussed but deferred as it retains measurable vision.",
    ],
  },
  // ── Lids / adnexa ─────────────────────────────────────────────────────────
  {
    diagnosis: "Sebaceous Cell Carcinoma",
    hints: [
      "A patient presents with a recurrent lump on the upper eyelid — the third episode in the same location over 18 months.",
      "Each previous episode was treated as a chalazion; the recurrent nature in the exact same site raises concern.",
      "The surrounding lid margin shows diffuse thickening and focal loss of lashes; the superior tarsal conjunctiva shows a velvety yellowish thickening on eversion.",
      "The lesion fails to respond to repeat curettage or intralesional steroid — behaviour inconsistent with a benign chalazion.",
      "Biopsy reveals pagetoid spread of malignant cells with foamy lipid-laden cytoplasm infiltrating the conjunctival epithelium.",
      "Wide surgical excision with frozen section margin control is performed; sentinel lymph node biopsy is discussed given the risk of regional metastasis.",
    ],
  },
  {
    diagnosis: "Floppy Eyelid Syndrome",
    hints: [
      "A patient presents with a chronically irritated eye that is worst on waking and has failed multiple treatments over two years.",
      "The symptoms are consistently worst immediately on waking and improve through the day; the patient predominantly sleeps on that side.",
      "The upper lid on the affected side everts spontaneously with minimal upward traction; the tarsal plate feels rubbery and lacks normal rigidity.",
      "The superior tarsal conjunctiva shows a velvety papillary reaction with mucoid discharge; punctate epithelial erosions are present on the superior cornea.",
      "The patient's partner reports loud snoring and witnessed apnoeic episodes; polysomnography confirms severe obstructive sleep apnoea.",
      "Lid-taping during sleep and CPAP therapy produce dramatic improvement in morning symptoms; horizontal lid-tightening surgery is planned for definitive management.",
    ],
  },
  // ── Posterior scleritis ───────────────────────────────────────────────────
  {
    diagnosis: "Posterior Scleritis",
    hints: [
      "A patient presents with severe, deep eye pain that is waking them from sleep and is not relieved by standard analgesics.",
      "The pain is boring in character; the anterior segment is entirely quiet with no injection, cells, or flare — anterior scleritis is excluded clinically.",
      "Fundoscopy reveals choroidal folds radiating from the posterior pole and a shallow exudative retinal detachment with no visible retinal break.",
      "B-scan ultrasonography shows thickening of the posterior coats of the globe and fluid in Tenon's space — producing the pathognomonic T-sign.",
      "MRI of the orbits confirms posterior scleral wall thickening and excludes an orbital mass, metastatic disease, and uveal effusion syndrome; the patient has a background of rheumatoid arthritis.",
      "Oral NSAIDs and systemic corticosteroids are commenced; immunosuppression is escalated in coordination with the patient's rheumatologist.",
    ],
  },
];

export const DIAGNOSIS_DEFS: Record<string, string> = {
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

export function getDiagnosisDef(diagnosis: string): string {
  return (
    DIAGNOSIS_DEFS[diagnosis] ??
    `${diagnosis}: A condition managed within the scope of optometric or ophthalmic practice.`
  );
}
