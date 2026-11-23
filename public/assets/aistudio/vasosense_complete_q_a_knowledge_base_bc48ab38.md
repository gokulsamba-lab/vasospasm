# VasoSense Wearable Microvascular Monitor — Complete Q&A Knowledge Base

---

## SECTION A: Raynaud's Phenomenon & Vasospasm Theory

**Q1: What is microvascular vasospasm (Raynaud's phenomenon)?**
A: Microvascular vasospasm is a sudden, temporary narrowing (constriction) of the small blood vessels (arterioles and capillaries) in the extremities—most commonly the fingers and toes—triggered by cold temperatures or emotional stress. This sharply reduces blood flow to the skin until the vessels relax and rewarm.

**Q2: Why do fingers change colors (White → Blue → Red) during an episode?**
A: This is known as the **triphasic color response**:
1. **White (Pallor):** Blood vessels clamp shut, cutting off blood flow to the fingertip.
2. **Blue (Cyanosis):** Small amounts of blood trapped in the capillaries lose their oxygen, turning the skin bluish/purplish.
3. **Red (Rubor / Rewarming):** As the spasm ends and vessels dilate, warm oxygenated blood rushes back in, causing redness, tingling, throbbing, or mild swelling. (Note: Not everyone experiences all three colors; some only notice sudden paleness and coldness.)

**Q3: What is the difference between Primary and Secondary Raynaud's?**
A:
- **Primary Raynaud's (Raynaud's disease):** Occurs on its own without an underlying medical illness. It usually starts between ages 15–30, affects both hands symmetrically, and rarely causes tissue damage.
- **Secondary Raynaud's (Raynaud's phenomenon):** Linked to an underlying condition (such as scleroderma, lupus, rheumatoid arthritis, thyroid disorders, or prolonged use of vibrating tools). It often starts later in life (over age 30), can be more severe or asymmetric, and requires medical evaluation by a rheumatologist.

**Q4: How is Raynaud's different from just having normal cold hands?**
A: In normal cold hands, the whole hand cools gradually and evenly without a sharp cutoff in blood flow. In a vasospasm episode, there is an abrupt drop in pulsatile blood volume (Perfusion Index), a sharp negative temperature gradient between the fingertip and the back of the hand, and often a distinct pale/white boundary on the finger.

**Q5: What are the most common triggers for an attack?**
A:
- Rapid temperature drops (stepping into air conditioning, holding a cold drink, reaching into a freezer).
- Emotional stress or anxiety (which activates the sympathetic "fight-or-flight" nervous system and constricts peripheral vessels).
- Nicotine/smoking and excessive caffeine (both cause vasoconstriction).
- Repetitive vibration (power tools, heavy typing).

**Q6: What should I do when the app alerts me to an active vasospasm episode?**
A: Move to a warmer environment, gently wiggle your fingers or swing your arms in circles to encourage blood flow, place your hands under your armpits, or run **warm (never hot)** water over your fingers. Avoid sudden extreme heat, which can burn numb skin.

**Q7: When should I seek urgent medical attention?**
A: Contact a doctor promptly if episodes occur on only one side of your body, become noticeably more frequent or painful, last for hours without rewarming, or if you develop sores, cracks, or ulcers on your fingertips.

**Q8: What happens inside the blood vessels at a cellular/nervous system level during an attack?**
A: Cold or stress activates sympathetic nerves that release **norepinephrine**, which binds to **$\alpha_{2C}$-adrenergic receptors** on the smooth muscle walls of digital arterioles. In people with Raynaud's, these receptors are hyper-reactive and migrate to the cell surface in cold temperatures, causing exaggerated smooth-muscle contraction that temporarily closes the vessel lumen.

**Q9: Why does emotional stress trigger a finger attack even in a warm room?**
A: Emotional stress triggers the autonomic nervous system's "fight-or-flight" response, releasing adrenaline and noradrenaline into the bloodstream. The body prioritizes blood flow to vital organs and large muscles by constricting peripheral skin blood vessels in the fingers and toes—even when ambient room temperature is warm.

**Q10: How is Raynaud's different from Acrocyanosis or Chilblains (Pernio)?**
A:
- **Raynaud's:** Episodic, sudden onset with sharp pale/blue color boundaries, followed by rapid rewarming and recovery.
- **Acrocyanosis:** Persistent, painless, symmetrical bluish discoloration of the hands/feet without the sudden white pallor phase.
- **Chilblains (Pernio):** Painful, itchy, red/purple inflammatory skin bumps caused by prolonged exposure to damp cold, lasting days rather than minutes.

**Q11: Can certain medications worsen Raynaud's episodes?**
A: Yes. Medications that constrict blood vessels—such as non-selective beta-blockers, decongestants (pseudoephedrine), ADHD stimulants, certain migraine drugs (ergotamines/triptans), and some chemotherapy agents—can trigger or worsen vasospasm. Always consult your physician before changing any prescribed medication.

**Q12: How does VasoSense help my rheumatologist compared to traditional hospital tests?**
A: Traditional tests like **Cold-Challenge Infrared Thermography** or **Laser Speckle Contrast Imaging (LSCI)** require expensive stationary lab cameras and rarely catch spontaneous daily episodes. VasoSense continuously tracks multi-modal perfusion, temperature gradients, and spectral color shifts in daily life, giving your doctor objective recovery curves and frequency logs instead of relying on memory.

---

## SECTION B: Understanding Your Live Sensor Metrics

**Q13: What is Perfusion Index (PI) and what do my numbers mean?**
A: Perfusion Index is the ratio of pulsatile arterial blood flow (AC) to non-pulsatile tissue/venous blood (DC), calculated as $PI = (AC / DC) \times 100\%$.
- **Normal resting fingertip PI:** Typically `2.0%` to `8.0%` (varies by individual baseline).
- **Cooling / Pre-vasospasm trend:** Steady drop below your personal baseline (e.g., `1.0% – 2.0%`).
- **Active Vasospasm:** Pulsatile AC waveform flattens, dropping PI below `1.0%` (often `0.2% – 0.8%`).

**Q14: Why does this device NOT show Blood Oxygen ($SpO_2$)?**
A: During a localized finger vasospasm, your lungs and heart are still oxygenating blood normally—the issue is mechanical narrowing of the finger vessels, not low systemic oxygen. Because the pulsatile AC signal collapses during a spasm, standard red-to-infrared $SpO_2$ calculations become noisy and inaccurate. Tracking **AC amplitude** and **Perfusion Index** directly measures the true physiological problem: blood volume reduction.

**Q15: What is the Distal–Dorsal Temperature Gradient ($\Delta T$)?**
A: It is the difference between your fingertip temperature ($T_{fingertip}$) and the back of your hand ($T_{dorsal}$): $\Delta T = T_{fingertip} - T_{dorsal}$.
- Normally, your fingertip is close to or slightly warmer than the back of your hand ($\Delta T \approx -1.0^\circ\text{C}$ to $+1.5^\circ\text{C}$).
- During a vasospasm, blood flow stops at the fingertip while the back of the hand stays relatively warm, causing $\Delta T$ to drop sharply (e.g., $-3.0^\circ\text{C}$ to $-8.0^\circ\text{C}$). Tracking $\Delta T$ prevents false alarms when you are simply in a cool room.

**Q16: What is Rewarming / Recovery Time?**
A: Recovery time measures how many minutes it takes after an episode's lowest temperature point for your fingertip temperature and Perfusion Index to return back toward your normal dorsal hand baseline. Rheumatologists use recovery curves to assess vascular reactivity and treatment effectiveness.

**Q17: What does the TCS34725 Spectral / Pallor Index measure?**
A: The TCS34725 RGB sensor shines a controlled white LED onto the nail bed inside an opaque shield and measures reflected red, green, and blue light. When blood leaves the nail bed (pallor), green and blue reflectance increase relative to red; during cyanosis, blue-to-red ratios shift.

**Q18: Why does the dashboard sometimes say "Window Discarded (High Motion)"?**
A: Finger movement squeezes blood vessels and shifts the optical sensor, creating fake spikes in the PPG signal that look like pulse waves or spasms. The **LIS3DH 3-axis accelerometer** detects hand motion; when motion exceeds a safe threshold, that 8–30 second window is flagged and excluded so you don't get false vasospasm alerts while walking, typing, or exercising.

**Q19: What is the Cooling Rate ($dT/dt$) and why is it tracked?**
A: Cooling rate ($dT/dt$, measured in $^\circ\text{C/min}$) measures how fast your fingertip temperature is dropping. A rapid drop (e.g., $> 0.5^\circ\text{C/min}$) paired with falling Perfusion Index warns the system of an acute vasospasm onset before full numbness or skin color change occurs.

**Q20: How does hand elevation affect my readings?**
A: Raising your hand above heart level lowers hydrostatic blood pressure in the fingers, naturally reducing PPG AC amplitude slightly. The **LIS3DH accelerometer** measures gravity vector orientation to detect hand elevation angle so the classifier distinguishes postural changes from true vasospasm.

**Q21: Why does the app measure Ambient Temperature and Humidity?**
A: Knowing whether you just stepped into a $16^\circ\text{C}$ air-conditioned room versus sitting in a warm $26^\circ\text{C}$ office helps distinguish **cold-induced vasospasm** from **stress-induced vasospasm** and improves clinical report context.

**Q22: What do the PPG Waveform Morphology & SNR metrics mean?**
A: A healthy fingertip PPG wave has a sharp systolic upstroke and a secondary dicrotic notch. During vasoconstriction, the wave shrinks, rounds out, and loses its dicrotic notch. **SNR (Signal-to-Noise Ratio)** verifies that the wave is genuine pulsatile blood flow rather than electrical or ambient light noise.

---

## SECTION C: Hardware & Engineering Architecture (FRDM-MCXN236)

**Q23: How do the optical sensors (MAX30102 & TCS34725) avoid interfering with each other?**
A: The MAX30102 uses Red (660 nm) and Infrared (880–940 nm) LEDs on the finger pad, while the TCS34725 uses a white LED on the nail bed. To guarantee zero optical crosstalk, the TCS34725 is enclosed in an opaque housing at a fixed standoff distance, and the MCU uses **strict time-multiplexing**—turning off the white LED during PPG sampling windows and vice versa.

**Q24: Why were TMP117 sensors chosen instead of standard DS18B20 temperature sensors?**
A: The TMP117 offers clinical-grade **$\pm 0.1^\circ\text{C}$ accuracy** without needing individual calibration, has a much smaller thermal mass (so it reacts seconds faster when a fingertip suddenly cools), and communicates cleanly over the same I²C bus as the other sensors.

**Q25: How does the Machine Learning model run on the FRDM-MCXN236 without an NPU?**
A: The FRDM-MCXN236 features an ARM Cortex-M33 processor, which easily runs lightweight **quantized Decision Trees or Random Forest classifiers** directly on the CPU. Because it evaluates ~30 engineered features once every 8–30 seconds rather than raw high-frequency video/audio, inference takes less than a millisecond with minimal battery drain.

**Q26: Why was the FRDM-MCXN236 chosen for this prototype?**
A: The NXP FRDM-MCXN236 provides dual-core ARM Cortex-M33 performance, multiple Flexcomm I²C/SPI/UART interfaces for simultaneous sensor acquisition, low-power modes for wearable battery life, and ample SRAM/Flash for real-time feature extraction and decision-tree inference.

**Q27: Why is a fixed-pressure mount used for the MAX30102 PPG sensor?**
A: If a PPG sensor is too loose, ambient light leaks in and micro-movements corrupt the signal. If it is too tight, mechanical pressure squeezes shut the digital capillaries and mimics a vasospasm. A fixed-pressure mechanism maintains consistent skin contact without restricting normal capillary perfusion.

**Q28: Why is the TCS34725 placed on the nail bed rather than the finger pad?**
A: The nail bed has a rich capillary network beneath a translucent nail plate with minimal melanin interference across different skin tones, making pallor and cyanosis color shifts far more consistent and measurable under controlled white LED illumination.

**Q29: How are the 5 hardware modules physically distributed on the hand?**
A:
1. **Finger Pad:** MAX30102 reflective PPG sensor (fixed-pressure contact).
2. **Side of Finger Pad:** TMP117 #1 (distal skin temperature).
3. **Nail Bed / Dorsal Finger:** TCS34725 RGB sensor + white LED in opaque housing.
4. **Dorsal Hand (Back of Hand):** TMP117 #2 (proximal reference temperature).
5. **Wrist / Finger Module:** FRDM-MCXN236 MCU, LIS3DH accelerometer, ambient sensor, event-marker button, RTC, microSD/SPI flash, power management, and BLE module.

---

## SECTION D: AI Model, Signal Processing & Public Datasets

**Q30: Which public datasets were used to develop and validate the signal processing pipeline?**
A: Because public datasets do not contain labeled Raynaud's attacks, five PhysioNet datasets were used strictly for preprocessing, SNR validation, motion rejection, and stress modeling:
1. **PhysioNet Pulse Transit Time (PTT) PPG Dataset:** Validates PPG AC/DC extraction, peak detection, Perfusion Index, and accelerometer motion energy.
2. **BUT PPG Database:** Benchmarks PPG signal quality and peak detection robustness under varying lighting and sensor contact conditions.
3. **Wearable Device Dataset (Induced Stress & Exercise):** Models peripheral skin temperature cooling slopes ($dT/dt$) and PPG pulse amplitude drops during structured stress.
4. **Wearable Exam Stress Dataset:** Models real-world autonomic nervous system vasoconstriction outside controlled lab rooms.
5. **QoL_Stress Dataset:** Helps differentiate stress-induced autonomic constriction from cold-induced peripheral vasospasm.

**Q31: How many features are fed into the on-device Machine Learning classifier?**
A: Approximately **30 engineered features** per 8–30 second window, combining PPG AC/DC & Perfusion Index metrics, dual-temperature gradients ($\Delta T$ and $dT/dt$), TCS34725 RGB reflectance ratios, LIS3DH motion variance & elevation angles, ambient temperature, and patient event-marker flags.

**Q32: Can the ML model personalize to my specific baseline?**
A: Yes. Running the **30-Second Baseline Calibration** records your resting Perfusion Index, resting $\Delta T$, and baseline nail-bed RGB color so the classifier evaluates relative deviations from *your* healthy baseline rather than relying solely on rigid population cutoffs.

---

## SECTION E: Device Usage, Troubleshooting & Offline Sync

**Q33: How should I wear the sensor for accurate readings?**
A:
1. Place the **MAX30102** snugly against the soft pad of your index or middle finger using the fixed-pressure strap.
2. Ensure **TMP117 #1** touches the side of the finger pad and **TMP117 #2** sits flat on the back (dorsal side) of your hand.
3. Rest your hand still for 30 seconds and run the **Baseline Calibration** in the Diagnostics tab whenever you put the device on.

**Q34: What happens if my phone is out of Bluetooth range during an attack?**
A: The wearable stores timestamped sensor windows and physical **event-marker button** presses locally on its **microSD / SPI Flash** using the onboard **Real-Time Clock (RTC)**. Once you reconnect to the web app, go to the **Offline SD Sync** tab to download all missed episodes seamlessly.

**Q35: When should I press the physical Event-Marker Button on the device?**
A: Press it the moment you feel tingling, numbness, coldness, or notice your fingers turning white or blue—even if your phone isn't nearby. It timestamps the exact window in firmware memory so you can add trigger notes later and help validate ML episode detection.

**Q36: What should I do if the PPG waveform looks flat or noisy when my hands are warm?**
A: Check three things in the **Hardware Diagnostics** tab:
1. Ensure the finger strap isn't overly tight (which restricts blood flow) or too loose (allowing ambient light leakage).
2. Check if the **LIS3DH Motion Flag** is active—keep your hand still for 10 seconds.
3. Gently wipe the MAX30102 optical window with a soft dry cloth to remove sweat or skin oils.

**Q37: Why does the app ask to Sync RTC Time upon pairing?**
A: The FRDM-MCXN236 relies on its Real-Time Clock (RTC) to timestamp offline microSD recordings accurately. Syncing RTC time from your browser ensures offline episodes align accurately with your daily activity and symptom diary.

**Q38: How can I connect the FRDM-MCXN236 to this Web App?**
A: You can connect in two ways using Google Chrome or Microsoft Edge:
- **Web Bluetooth (BLE):** Pair wirelessly to the wearable's BLE UART module from the *Account & Device Pairing* tab.
- **Web Serial (USB-UART):** Connect the FRDM-MCXN236 board directly to a laptop USB port for real-time bench testing and firmware debugging.

**Q39: Can I use the web app without the hardware connected?**
A: Yes! Switch the top-bar data source to **Simulator Mode** to test *Normal Perfusion*, *Cold Trigger / Cooling Trend*, *Active Vasospasm Episode*, and *High Motion Artifact* states across all live charts and AI diagnostics.

**Q40: Is this device a medical diagnostic tool?**
A: No. VasoSense is an assistive physiological monitoring and research prototype designed to objectively track peripheral perfusion, skin temperature gradients, and recovery patterns. Always share your exported Clinical Reports with a qualified rheumatologist or physician for medical diagnosis and treatment decisions.