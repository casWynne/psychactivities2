
document.addEventListener("DOMContentLoaded", () => {
    const mainContent = document.querySelector("main");

    // Introductory content
    const introContent = {
        title: "L6 Psychology Optional Module Information",
        description: `
            This site has been put together to help you choose your optional modules for Level 6. Here are few key things to keep in mind:
<h4>Module Availability</h4>
<li>Modules will only run next year if they attract sufficient numbers of students to them.</li>
<li>If a module is not running you will be allocated your reserve choice.</li>
<li>We cannot, therefore, guarantee that all of the modules listed will run next year, but you will receive confirmation of your choices in May.</li>
</ul>
<h4>The Timetable</h4>
<ul>
<li>The Level 6 timetable is organised in blocks.</li>
<li>We cannot run option modules at the same time.</li>
<li>Your timetable depends on your core modules (e.g., PSY6145 Psychology Research Project), the optional modules you choose and your programme of study.</li>
<li>Independent study with supervision from academic supervisors will form a lot of how you spend your time throughout Level 6. Supervision hours form a large component of modules such as PSY6145 Psychology Research Project and PSY6115 Professional Learning Through Work. So you may have less ‘classroom’ time than in previous years.</li>
</ul>          
            To get started click on your programme at the top.
            `
    };
    // function to load introductory content
    function loadIntroContent() {
        mainContent.innerHTML = `
            <h2>${introContent.title}</h2>
            <p>${introContent.description}</p>
        `;
    }

    //function to add listeners to the programme buttons
    function addProgrammeButtonListeners() {
        //this code will load main content information on click - so we need a load content information function
        const newProgrammeButtons = document.querySelectorAll(".programme-option");
        newProgrammeButtons.forEach(button => {
            button.addEventListener("click", () => {
                const programmeId = button.id;
                const programmeInfo = programmeDetails[programmeId];

                if (programmeInfo) {
                    updateMainContent(programmeInfo.title, programmeInfo.description, programmeId, programmeInfo.modules);
                    // alert("updating")
                }

                setInactivityTimeout();
            });
        });
    };


    function updateMainContent(title, description, programmeId, moduleIds = []) {
        let mandatoryModulesHTML = "";
        let optionalYearLongHTML = "";
        let optionalSemester1HTML = "";
        let optionalSemester2HTML = "";

        if (moduleIds.length) {
            moduleIds.forEach(moduleId => {
                const module = modules[moduleId];
                if (module) {
                    const moduleSection = createModuleSection(moduleId);

                    if (module.mandatory) {
                        mandatoryModulesHTML += moduleSection;
                    } else {
                        if (module.yearLong && (programmeId === "with-soc" || programmeId === "with-crim")) {
                            console.log("true")
                            optionalYearLongHTML += moduleSection;
                        }
                        if (module.semester1) {
                            optionalSemester1HTML += moduleSection;
                        }
                        if (module.semester2) {
                            optionalSemester2HTML += moduleSection;
                        }
                    }
                }
            });
        }

        mainContent.innerHTML = `
            <h2>${title}</h2>
            <p>${description}</p>
    
            <h3>Mandatory Programme Modules</h3>
            ${mandatoryModulesHTML || "<p>No unique modules available for this programme.</p>"}
    
            ${programmeId === "with-soc" || programmeId === "with-crim"
                ? `<h3>Optional Year-Long Modules</h3>${optionalYearLongHTML || "<p>No year-long modules available.</p>"}`
                : ""
            }
    
            <h3>Optional Modules - Semester 1</h3>
            ${optionalSemester1HTML || "<p>No Semester 1 modules available.</p>"}
    
            <h3>Optional Modules - Semester 2</h3>
            ${optionalSemester2HTML || "<p>No Semester 2 modules available.</p>"}
    
            <button class="back-button">Back</button>
        `;

        // Add event listeners to collapsible buttons
        const collapsibleButtons = document.querySelectorAll(".collapsible");
        collapsibleButtons.forEach(button => {
            button.addEventListener("click", function () {
                this.classList.toggle("active");
                const content = this.nextElementSibling;
                content.style.display = content.style.display === "block" ? "none" : "block";
            });
        });

        // Add event listener to the "Back" button
        const backButton = document.querySelector(".back-button");
        backButton.addEventListener("click", () => {
            loadIntroContent();
        });
    }


    function createModuleSection(moduleId) {
        const module = modules[moduleId];
        let moduleClass = module.sociology ? "sociology-module" : "psychology-module";
        console.log(moduleId);
        return `
            <div class="${moduleClass}">
                <button class="collapsible">${moduleId.toUpperCase()} - ${module.title}</button>
                <div class="module-content">
                    <p>${module.description}</p>
                    ${module.staff ? `<h3>Staff</h3><p>${module.staff}</p>` : ""}
                    ${module.credits ? `<h3>Credits</h3><p>${module.credits}</p>` : ""}
                    ${module.assignments ? `<h3>Assessments</h3><p>${module.assignments}</p>` : ""}
                    ${module.day ? `<p><strong>2024-2025 timetable:</strong> ${module.day}*</p>` : "<p><strong>2024-2025 timetable:</strong> There is no timetable information for this module. Please contact module lead for more information."}
                    ${module.day ? `<p class="Polite-notice">*Timetable information is from the first draft of the AY25/26 timetable. These are subject to change as the timetable becomes finalised. Please use information for guidance only.` : ""}
                </div>
                <div class="gap"></div>
            </div>
        `;
    }

    function setInactivityTimeout() {
        clearTimeout(window.inactivityTimeout);
        window.inactivityTimeout = setTimeout(() => {
            loadIntroContent();
        }, 300000); // 300,000 milliseconds = 5 minutes
    }

    loadIntroContent();
    addProgrammeButtonListeners();
});

const programmeDetails = {
    "psych": {
        title: "Psychology",
        sociology: false,
        description: "Students on this programme can choose <strong>four</strong> optional modules in total. You can choose from modules in either semester 1 or semester 2. Consider balancing your choices across the two semesters.",
        modules: [
            "psy6145", "psy6115", "psy6005", "psy6035", "psy6045", "psy6125", "psy6165",
            "psy6015", "psy6065", "psy6075", "psy6085", "psy6135", "psy6155", "psy6175"
        ]
    },
    "counselling": {
        title: "Counselling Psychology",
        description: "Students on this programme can choose <strong>two</strong> optional modules. You should choose from Semester 1 or Semester 2 options. Consider balancing your choices across the two semesters.",
        modules: [
            "psy6145", "psy6115", "psy6005", "psy6035", "psy6045", "psy6125", "psy6165",
            "psy6015", "psy6013", "psy6075", "psy6085", "psy6135", "psy6155", "psy6175"
        ]
    },
    "sport-psych": {
        title: "Sport Psychology",
        sociology: false,
        description: "Students on this programme can choose <strong>two</strong> optional modules. You should choose from Semester 1 or Semester 2 options. Consider balancing your choices across the two semesters.",
        modules: [
            "psy6145", "psy6115", "psy6005", "psy6035", "psy6045", "psy6125", "psy6165",
            "psy6015", "psy6065", "psy6075", "psy6085", "psy6135", "psy6155", "psy6175", "psy6033"
        ]
    },
    "forensic-psych": {
        title: "Forensic Psychology",
        sociology: false,
        description: "Students on this programme can choose <strong>two</strong> optional modules. You should choose from Semester 1 or Semester 2 options. Consider balancing your choices across the two semesters.",
        modules: [
            "psy6145", "psy6115", "psy6005", "psy6035", "psy6045", "psy6125", "psy6165",
            "psy6015", "psy6065", "psy6075", "psy6085", "psy6023", "psy6155", "psy6175"
        ]
    },
    "child-dev": {
        title: "Psychology and Child Development",
        sociology: false,
        description: "Students on this programme can choose <strong>two</strong> optional modules. You should choose from Semester 1 or Semester 2 options. Consider balancing your choices across the two semesters.",
        modules: [
            "psy6145", "psy6115", "psy6005", "psy6035", "psy6045", "psy6125", "psy6165",
            "psy6015", "psy6065", "psy6075", "psy6085", "psy6135", "psy6155", "psy6175", "psy6003"
        ]
    },
    "with-soc": {
        title: "Psychology with Sociology",
        sociology: false,
        description: "Students on this programme must choose <strong class='purple'>two optional modules from Psychology</strong> (marked with purple boxes), and either:<ul><li class='blue'>one year-long module from Sociology (marked with blue boxes)</li></ul><strong>OR</strong><ul><li class='blue'>two shorter Sociology modules (one from Semester 1 and one from Semester 2).</li></ul>Consider balancing your choices across the two semesters.",
        modules: [
            "psy6145", "psy6115", "psy6005", "psy6035", "psy6045", "psy6125", "psy6165",
            "psy6015", "psy6065", "psy6075", "psy6085", "psy6135", "psy6155", "psy6175",
            "soc6053", "soc6033", "soc6073", "soc6063", "soc6025", "soc6035", "soc6065", "soc6055", "soc6075", "soc6085"

        ]
    },
    "with-crim": {
        title: "Psychology with Criminology",
        sociology: true,
        description: "Students on this programme must choose <strong class='purple'>two optional modules from Psychology</strong> (marked with purple boxes), and either:<ul><li class='blue'>one year-long module from Criminology (marked with blue boxes)</li></ul><strong>OR</strong><ul><li class='blue'>two shorter Criminology modules (one from Semester 1 and one from Semester 2).</li></ul> Consider balancing your choices across the two semesters.",
        modules: [
            "psy6145", "psy6115", "psy6005", "psy6035", "psy6045", "psy6125", "psy6165",
            "psy6015", "psy6065", "psy6075", "psy6085", "psy6135", "psy6155", "psy6175",
            "soc6053", "soc6033", "soc6073", "soc6063", "soc6025", "soc6035", "soc6095", "soc6065", "soc6055", "soc6075", "soc6085"
        ]
    }
};

const modules = {
    "psy6145": {
        title: "Psychology Research Project",
        staff: "Dr Tim Vestner, Dr Fayme Yeates",
        credits: 45,
        sociology: false,
        yearLong: false,
        semester1: true,
        semester2: true,
        description: "An independent research project conducted throughout the year. We will ask you to produce your research idea before the end of Level 5.",
        assignments: "Poster Conference Presentation (20%), 8,000-words Research Report (80%)",
        mandatory: true,
        day: "**Semester 1 only** Mondays: 9am - 10am"
    },
    "psy6115": {
        title: "Professional Learning Through Work",
        staff: "Dr Ben Morris",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: true,
        semester2: true,
        description: "A work-based learning module to develop professional experience which runs throughout both semesters.",
        assignments: "2,000-word CV and Skills Mapping Report (50%), 15-minute Viva (Interview Practice) (50%), 20-hours Work-based/Skill-based experience (Pass/Fail)",
        mandatory: true,
        day: "**Semesters 1 and 2** Semester 1 Monday (lecture) in weeks 1 and 2 only: 10am - 12pm and Friday (tutorial) in weeks 2, 6 and 10 only. Semester 2 Thursday in weeks 2 and 10 only: 12pm - 2pm."

    },
    "psy6005": {
        title: "Biopsychology of Stress and Illness",
        staff: "Dr James Jackson",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: true,
        semester2: false,
        description: "This module explores the biological foundations of stress and illness, examining how our bodies respond to stressors and the role of subjective appraisal in health outcomes. Stress is a key precursor to both physical and mental health issues, and the module investigates how pathological conditions can emerge. Topics include stress appraisal, hormonal and neurotransmitter changes, immune function, cardiovascular disease, affective disorders, addiction, epigenetics, coping strategies, and accessing support. <p>Students will progress towards submission through structured weekly milestones, with informal group presentations fostering cohort-wide discussion and real-time feedback. Additionally, each group will receive a personalized podcast (via Panopto) summarizing their progress and offering further insights.</p>",
        assignments: "2,000-word Grant Proposal (100%)",
        mandatory: false,
        day: "Thursdays: 9:30am - 12pm"
    },
    "psy6035": {
        title: "Business Psychology",
        staff: "Bruce Rainford",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: true,
        semester2: false,
        description: "Business Psychology explores how psychology enhances workplace performance, job satisfaction, and organisational success. Covering key areas like recruitment, motivation, leadership, and workplace culture, this module applies psychological principles to real-world professional settings. Whether or not you pursue a career in business psychology, the insights gained will be valuable across industries, particularly when applying for jobs. Topics include career development, team dynamics, performance management, organisational change, and coping with workplace challenges.",
        assignments: "2,000-word Case Study (100%)",
        mandatory: false,
        day: "Thursdays: 2pm - 4:30pm",
    },
    "psy6045": {
        title: "Psychology of Mental Health and Distress",
        staff: "Dr Louisa Peters",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: true,
        semester2: false,
        description: "This module provides a critical exploration of mental distress, examining its historical, social, and cultural contexts. It covers key models of mental illness, including biomedical, biopsychosocial, and service-user-led approaches, while also addressing barriers to treatment and equitable access to care. <p>Through lectures, group discussions, and debates, students will engage with topics such as psychiatric diagnosis, stigma, psychological interventions, and recovery. This challenging yet engaging module strengthens critical thinking skills, offering valuable insights applicable across psychology and mental health fields.</p>",
        assignments: "2,000-word Written Assignment (100%)",
        mandatory: false,
        day: "Wednesdays: 9am - 11:30am"
    },
    "psy6125": {
        title: "Health Behaviour Change in Context",
        staff: "Dr Ben Morris",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: true,
        semester2: false,
        description: "This module explores how health psychology assesses and influences behaviour change across various settings, from hospitals to communities. Topics include the Leeds Health Profile, health behaviours, behaviour change models, and effective communication for a lay audience. <p>Taught through interactive seminars and online resources, this module equips students with practical skills relevant to careers in health psychology, with many past students progressing into professional training or using it to enhance their degree profile.</p>",
        assignments: "2,500-word Intervention Assessment (100%)",
        mandatory: false,
        day: "Mondays: 12pm - 1pm & Wednesdays: 11:30am - 1pm"
    },
    "psy6165": {
        title: "Illusions, Biases, and Cognitive Impairments",
        staff: "Dr Tim Vestner",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: true,
        semester2: false,
        description: "This module explores how outliers, individual differences, and disorders reveal the complexities of human cognition. By examining amnesia, visual disorders, cultural and individual biases, and neurological conditions, students will gain insight into memory, perception, and consciousness. <p>Through critical analysis of atypical cognitive phenomena, students will challenge conventional understanding of how the mind works. Assessment allows for exploration of a chosen topic, encouraging deeper engagement with the subject.</p>",
        assignments: "2,500-word Essay (100%)",
        mandatory: false,
        day: "Fridays: 1.30pm - 4pm"
    },
    "psy6015": {
        title: "Psychology Negotiated Essay",
        staff: null,
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "This module offers students the opportunity to explore a self-chosen topic within psychology through a 2,500-word critical essay, without conducting empirical research. With guidance from a supervisor, students can delve deeply into an area of personal interest, ensuring it falls within psychology and does not overlap with other Level 6 assessments. <p>Past topics have included eugenics, social representation theory, gender identity, electroconvulsive therapy, and cultural influences on biological evolution.</p> Students submit a proposal at the start of Semester 2 and are matched with a supervisor from a diverse range of expertise, including critical psychology, forensic psychology, and mental health. Early discussion with staff is encouraged to refine ideas.",
        assignments: "2,500-word Negotiated Essay (100%)",
        mandatory: false,
        day: "Wednesday, week 1 only: 9am - 10am"
    },
    "psy6065": {
        title: "Counselling Psychology",
        staff: "Bruce Rainford",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "This module explores the theories, techniques, and applications of counselling psychology, focusing on the Psychodynamic, Humanistic, and Cognitive-Behavioural approaches. Students will critically examine how these frameworks address psychological distress and evaluate their effectiveness through research evidence.<p>The module also covers integrated therapy approaches, alternative delivery methods (e.g., time-limited therapy, NHS Stepped Care), and emerging trends, including new technologies and Positive Psychology.</p><p>Key topics include:</p><ul><li>The origins and applications of psychodynamic, humanistic, and cognitive-behavioural therapy</li><li>Therapeutic relationships and counselling delivery models</li><li>Innovations in counselling, including digital interventions</li><p>Assessment involves a client case study, where students apply multiple therapeutic approaches to assess psychological distress and develop an evidence-based intervention plan.</p>",
        assignments: "2,500-word Case Study (100%)",
        mandatory: false,
        day: "Thursdays: 2pm - 4:30pm"
    },
    "psy6075": {
        title: "Critical Psychology",
        staff: "Dr Candice Whitaker, Dr Alison Torn",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "Co-designed with Leeds Trinity psychology students, this module applies a discursive lens to critically explore topics decided on by the cohort. It uses interpretative frameworks to explore key ideological dilemmas and personal perspectives. The module is framed by two central questions: <ul><li>How does psychology help people?</li><li>How could psychology help people?</li></ul>Sessions are highly interactive, featuring small group discussions and debates.",
        assignments: "2,000-word Written Report (100%)",
        mandatory: false,
        day: "Wednesdays: 10am - 12.30pm"
    },
    "psy6085": {
        title: "Cyberpsychology",
        staff: "Dr Paul McGivern, Dr Tim Vestner",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "This module explores the psychological impact of technology and human-computer interaction, examining how digital advancements shape individuals and society. Topics include online relationships, social media, gaming, addiction, cybercrime, data security, and the online behavior of children and young people. <p>Drawing from social, cognitive, health, and developmental psychology, students will critically analyze how technology influences thoughts, behaviors, and identity. The module also considers the benefits and challenges of emerging digital trends in education, health, and social settings.</p>",
        assignments: "2,500-word Written Assignment (100%)",
        mandatory: false,
        day: "Fridays: 1.30pm - 4pm"
    },
    "psy6135": {
        title: "Forensic Psychology",
        staff: "Dr Zac Nahouli",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "This module explores the role of psychology in the criminal justice system, examining how psychological theories apply to crime, criminal behavior, and offender rehabilitation. Students will critically assess psychology's impact at all stages, from crime detection to prosecution, incarceration, and rehabilitation. <p>Key topics include:</p><ul><li>Theories of crime and offender motivations</li><li>Violent and sexual offenders</li><li>Personality disorders and risk assessment</li><li>Gender differences in offending</li><li>Young offenders and serial killers</li></ul><p>By the end of the module, students will have a comprehensive understanding of contemporary forensic psychology and its real-world applications.</p>",
        assignments: "2,500-word Essay (100%)",
        mandatory: false,
        day: "Mondays: 9am - 11.30am"
    },
    "psy6155": {
        title: "Environmental Psychology",
        staff: "Dr Laura De Pretto",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "This module examines the psychological relationship between humans and the natural environment, exploring both our impact on the planet and how nature influences wellbeing and psychological outcomes. <p>Students will investigate two key areas:</p><ol><li>Encouraging pro-environmental behavior – Understanding, assessing, and modifying environmental awareness using psychological theories, with a focus on the UN Sustainable Development Goals.</li><li>The psychological benefits of nature – Exploring restorative environments, biophilia, nature therapies, and child development.</li></ol><p>For assessment, students will create a resource to promote pro-environmental behaviors, choosing from formats such as educational workshops, podcasts, or infographics.</p>",
        assignments: "2,000-words or equivalent Negotiated Assessment (100%)",
        mandatory: false,
    },
    "psy6175": {
        title: "Collaborative Insights in Psychology and Culture",
        staff: "Dr Laura De Pretto",
        credits: 15,
        sociology: false,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "This module explores cross-cultural psychology, examining how culture shapes behavior, cognition, and emotions. Students will engage in online, multicampus sessions with international peers and lecturers, gaining diverse perspectives on psychological theories and practices.<p>Key topics include:</p><ul><li>Cultural dimensions of personality, emotion, and communication</li><li>The psychological effects of globalization, migration, and acculturation</li>Cross-cultural frameworks applied to real-world issues</li></ul><p>Through group discussions, case studies, and collaborative international projects, students will critically analyze cultural influences on psychology and develop a deeper understanding of global perspectives.</p>",
        assignments: "2000-word Cultural Immersion Reflection and Analysis (100%)",
        mandatory: false
    },
    "psy6013": {
        title: "Applied Counselling Psychology",
        staff: null,
        credits: 30,
        sociology: false,
        yearLong: true,
        semester1: false,
        semester2: false,
        description: "This module focuses on the practical application of counselling psychology, exploring interventions and therapeutic techniques. Students learn how to tailor psychological approaches to meet the diverse needs of clients in various contexts.",
        assignments: "A case study analysis and reflective essay, where students apply counselling theories to practical scenarios, demonstrating their understanding of therapeutic interventions.",
        mandatory: true,
        day: "Fridays: 10.30am - 1pm"
    },
    "psy6023": {
        title: "Applied Forensic Psychology",
        staff: null,
        credits: 30,
        sociology: false,
        yearLong: true,
        semester1: false,
        semester2: false,
        description: "In this module, students apply their knowledge to complex forensic cases, focusing on intervention strategies, risk assessment, and the evaluation of rehabilitation programs. The module emphasizes critical thinking and reflective practice, preparing students for professional roles in forensic psychology.",
        assignments: "A case study analysis and reflective essay applying forensic psychology principles to real-world scenarios.",
        mandatory: true,
        day: "Fridays: 10.30am - 1pm"
    },
    "psy6003": {
        title: "Applied Child and Educational Psychology",
        staff: null,
        credits: 30,
        sociology: false,
        yearLong: true,
        semester1: false,
        semester2: false,
        description: "In this module we will explore the role of wider society, educational psychologists, and other school-based practitioners in supporting children's wider development, from developing socioemotional skills to ensuring their wellbeing. We will be asking questions like: 'Are schools a good place to address child mental health issues?', 'How can schools improve pupil wellbeing?', and 'What evidence is there that school-based interventions work?'. Throughout the module you will get the chance to put yourself in the shoes of an educational psychologist, drawing on psychological ideas and new research to suggest strategies to support those in education settings. You'll also get to meet members of our wider psychology team, learning how they apply their specialist knowledge areas to supporting children's development in a variety of contexts.",
        assignments: "Students will write a comprehensive essay evaluating the role of educational psychologists and other practitioners in supporting child development (50%), and working together to present a case study or an intervention strategy to support children and young people in educational settings.",
        mandatory: true,
        day: "Fridays: 10.30am - 1pm"
    },
    "psy6033": {
        title: "Sport Psychology in Context",
        staff: null,
        credits: 30,
        sociology: false,
        yearLong: true,
        semester1: false,
        semester2: false,
        description: "This module explores the application of sport psychology principles in diverse contexts, such as professional sports teams, individual athletes, and community sports settings. It includes a critical evaluation of case studies, intervention strategies, and contemporary issues in sport psychology. Students develop a sophisticated understanding of how psychological factors can impact performance, well-being, and development across different populations and levels of sport participation.",
        assignments: null,
        mandatory: true,
        day: "Fridays: 10.30am - 1pm"
    },
    "soc6053": {
        title: "Genocide Studies",
        staff: "Tom Naden",
        credits: 30,
        sociology: true,
        yearLong: true,
        semester1: false,
        semester2: false,
        description: "This module offers a critical introduction to Genocide Studies, exploring historical and contemporary cases while examining how genocide is memorialized across different contexts. You'll engage with foundational theories, assess international legal responses, and analyze genocide's relationship to crimes against humanity, war crimes, and ethnic cleansing. The module also covers sociological, criminological, and psychological perspectives on perpetration, the aftermath of genocide, and the emerging concept of ecocide.",
        assignments: "Semester 1: Case Study Report (2500 words), Semester 2: Negotiated Essay",
        mandatory: false
    },
    "soc6033": {
        title: "Justice, Punishment, and Human Rights",
        staff: "Dr Shaun McDaid",
        credits: 30,
        sociology: true,
        yearLong: true,
        semester1: false,
        semester2: false,
        description: "This module explores the interplay between justice, punishment, and human rights, questioning whether the modern criminal justice system maintains the right balance.<p>In Semester 1, you'll examine the history of punishment through the works of John Locke, Jeremy Bentham, and Michel Foucault, assessing how human rights shape legal frameworks.</p><p>In Semester 2, the focus shifts to punishment philosophies—Deterrence, Incapacitation, Rehabilitation, and Retribution—analyzing their impact on offenders, victims, and society.</p>",
        assignments: "Semester 1: 15 minute indiviudal presentation or 20 minute group presentation, Semester 2: Written Assignment (2500 words)",
        mandatory: false
    },
    "soc6073": {
        title: "Young People, (In)justice & Crime",
        staff: "Dr Liam Wrigley",
        sociology: true,
        credits: 30,
        yearLong: true,
        semester1: false,
        semester2: false,
        description: "This module critically explores youth justice, examining how ethnicity, gender, politics, and culture shape young people's experiences within the criminal justice system. You'll engage with key social justice issues, analysing how inequalities impact crime control and rehabilitation. Topics include adverse childhood experiences, trauma-informed practices, child-first approaches, and serious youth violence, providing a theoretical and policy-driven perspective on modern youth justice.",
        assignments: "Semester 1: Research Report Briefing (3000 words), Semester 2: Negotiated Presentation (10 minutes)",
        mandatory: false
    },
    "soc6063": {
        title: "Organised Crime",
        staff: "Dr Rob Hornsby",
        sociology: true,
		credits: 30,
        yearLong: true,
        semester1: false,
        semester2: false,
        description: "This module examines how law enforcement, government bodies, and partner agencies combat organised crime across regional and international borders. You'll explore the illegal trade of weapons, drugs, and stolen goods, alongside human trafficking, modern slavery, and financial crimes like fraud, corruption, and money laundering. The module also delves into corporate crime, covering tax evasion, insider trading, and environmental violations, while analysing how criminals exploit technology and the internet. Through case studies and real-world examples, you'll gain insights into the strategies used to tackle these complex threats.",
        assignments: "Semester 1: Podcast/Negotiated (20 minutes), Semester 2: Online Quiz (60 minutes)",
        mandatory: false
    },
    "soc6025": {
        title: "Gender and Society",
        staff: "Jess Egan",
        credits: 15,
        sociology: true,
        yearLong: false,
        semester1: true,
        semester2: false,
        description: "This module critically examines gender as a social construct, exploring how it is produced, performed, and contested in everyday life. You'll challenge common assumptions about gender and analyze key topics such as gender inequality, power, family, reproduction, masculinity, labor, identity, social control, and media representation. Drawing on Gender Studies and Sociology, the module encourages interdisciplinary thinking to understand how gender shapes broader social transformations in contemporary society.",
        assignments: "Case Study (2500 words)",
        mandatory: false
    },
    "soc6035": {
        title: "Policing Priorities",
        staff: "Dr Kirsty Bennett",
        credits: 15,
        sociology: true,
        yearLong: false,
        semester1: true,
        semester2: false,
        description: "This module explores key policing and security challenges, including cybercrime, terrorism, and intelligence operations. You'll critically examine the role and effectiveness of law enforcement and intelligence agencies, with a focus on Britain's National Crime Agency and MI5. Through case studies and security studies frameworks, the module provides a comprehensive understanding of modern policing strategies and the evolving landscape of crime prevention.",
        assignments: "Negotiated Case Study (2500 words)",
        mandatory: false
    },
    "soc6095": {
        title: "Intelligence, Security, and the British State",
        staff: "Jonathan Jackson",
        credits: 15,
        sociology: true,
        yearLong: false,
        semester1: true,
        semester2: false,
        description: "This module explores the evolving role of intelligence agencies, police, and the military in addressing security threats in Britain since 1900. You'll examine how institutions have adapted to challenges such as espionage, terrorism, state interference, and cyber-security, critically assessing their impact within a democratic framework. Key topics include intelligence during World Wars, the Cold War, the Troubles in Northern Ireland, the War on Terror, and emerging security threats. Through historical and theoretical perspectives, you'll develop a deeper understanding of security studies and its real-world applications.",
        assignments: "Case Study (2500 words)",
        mandatory: false
    },
    "soc6065": {
        title: "Crimes of the 21st Century",
        staff: "Dr Liam Wringley",
        credits: 15,
        sociology: true,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "This module explores why individuals and groups commit crime and inflict harm, drawing on contemporary criminological theory to understand criminality in a rapidly changing world. You'll critically examine how social, environmental, economic, and technological shifts—such as protests, climate change, financial crises, and the dark web—have influenced crime and harm. The module challenges you to assess how criminological theory explains these developments and why people choose to harm others and themselves.",
        assignments: "Critical review of a journal article (2500 words)",
        mandatory: false
    },
    "soc6055": {
        title: "Criminalised Women",
        staff: "Natalie Rutter",
        credits: 15,
        sociology: true,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "This module examines the lived experiences of women in the criminal justice system, a frequently marginalised and overlooked group. Grounded in feminist criminology, it critically explores how systemic failures, stigma, and gendered stereotypes shape women's pathways into crime and their chances of desistance. Through research, policy, and practice, you'll analyse the structural inequalities that impact criminalised women and challenge dominant patriarchal and neoliberal narratives within society.",
        assignments: "One page zine plus 2000 words",
        mandatory: false
    },
    "soc6075": {
        title: "Breathing Criminology: Inside Perspectives",
        staff: "Andi Brierley",
        credits: 15,
        sociology: true,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "This module explores Convict Criminology and Lived Experience Criminology, examining how insights from those with first-hand experience of criminality and incarceration shape criminological knowledge. You'll critically assess the thematic, empirical, and conceptual contributions of lived experience to criminology, evaluating whether these perspectives enhance or challenge traditional understandings of crime, justice, and rehabilitation.",
        assignments: "Choose 1 of the following: 30 minute paired podcast, 15 minute individual presentaiton, or 2000 word individual literature review",
        mandatory: false
    },
    "soc6085": {
        title: "Criminal Deaths and Society's Grief",
        staff: "Dr Kirsty Bennett",
        credits: 15,
        sociology: true,
        yearLong: false,
        semester1: false,
        semester2: true,
        description: "This module explores how society responds to death, particularly in cases of homicide and violent crime. You'll examine forensic and criminal investigations, the role of coroner's inquests, and how the media shapes public perception of death. Through case studies, you'll analyse grief models, mourning practices, and cultural differences in public grieving, considering the psychological and social impact on victims' families and communities. The module also critically evaluates how individuals navigate societal expectations of grief, especially in high-profile cases.",
        assignments: "10-15 minute podcast recording OR 2,000 word case study reflection.",
        mandatory: false
    }
};
