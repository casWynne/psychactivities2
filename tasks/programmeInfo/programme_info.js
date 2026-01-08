// Wait for the DOM to fully load before running the script
document.addEventListener("DOMContentLoaded", () => {
    const mainContent = document.querySelector("main");

    // Introductory content
    const introContent = {
        title: "Welcome to Psychology at Leeds Trinity University",
        description: `
            Discover a variety of Psychology programmes designed to provide you with the skills, 
            knowledge, and experience you need for a rewarding career in psychology. All our undergraduate courses 
            are accredited by the British Psychological Society (BPS), ensuring you gain a high-quality 
            education that meets professional standards.
            <img src="../../assets/branding/BPS-Logo.png" alt="BPS Logo" class="bps-logo">
            At Leeds Trinity, we combine theory with practice, giving you hands-on experience through 
            work experience and practical projects. Explore topics like Counselling, Forensic 
            Psychology, Sport Psychology, and Child Development in our supportive learning environment.
            <br><br>
            To start exploring our programmes, select one of the options below:
        `
    };

    // Programme information (with associated modules)
    const programmeDetails = {
        foundation: {
            title: "Foundation Year in Psychology",
            description: "The Foundation Year in Psychology at Leeds Trinity University is designed to prepare students for successful entry into an undergraduate degree programme in psychology. It provides a broad introduction to psychology and develops essential academic skills. The foundation year is structured to build knowledge and confidence, ensuring students have the necessary skills to succeed in higher education.",
            modules: ["foundation-psych", "research-apply-psych", "psychology-project", "academic-skills"]
        },
        psych: {
            title: "BSc Psychology",
            description: "The BSc (Hons) Psychology at Leeds Trinity University is a comprehensive and engaging programme accredited by the British Psychological Society (BPS). This course provides students with foundational and advanced knowledge across core domains such as cognitive, developmental, social, and biological psychology. The programme is designed to integrate theory with practice, offering opportunities for placements and professional challenges to build employability skills and practical experience. Throughout the three years, students engage in various assessments to develop analytical, presentation, and research skills essential for psychology professionals. The structure is flexible, with options for tailoring learning experiences through optional modules in the final year. Compared to our other programmes, students studying BSc Psychology can choose more optional modules in their final year, allowing our students the oppertunity to explore a wide range of different topics in Psychology.",
            modules: ["introduction-to-research", "understanding-human-behaviour", "contemp-psych-1", "professional-development-psych", "research-skills-for-psych", "mind-brain-social", "contemp-psych-2", "psych-prof-dev", "psych-research-project", "prof-learn-work", "optional-modules"]
        },
        counselling: {
            title: "BSc Counselling Psychology",
            description: "The BSc (Hons) Counselling Psychology at Leeds Trinity University provides a comprehensive understanding of psychological theory, research methods, and applied counselling techniques. The program focuses on key areas such as developmental, social, and cognitive psychology, with a specific emphasis on counselling approaches. The programme is accredited by the British Psychological Society (BPS), ensuring that graduates meet the standards required for further postgraduate study and professional training in psychology. Please see below for a brief introduction to each module:",
            modules: ["introduction-to-research", "understanding-human-behaviour", "intro-to-counselling", "professional-development-psych", "research-skills-for-psych", "mind-brain-social", "counselling-theory-practice", "psych-prof-dev", "psych-research-project", "prof-learn-work", "applied-counselling-psych", "optional-modules"]
        },
        "sport-psych": {
            title: "BSc Sport Psychology",
            description: "The BSc (Hons) Sport Psychology programme at Leeds Trinity University integrates psychological theories and principles to explore their application in sport and exercise settings. The programme covers a variety of psychological domains, focusing on the practical implementation of sport psychology techniques and concepts. It is accredited by the British Psychological Society, which ensures that graduates are eligible for Graduate Basis for Chartership (GBC), the first step towards becoming a Chartered Psychologist.",
            modules: ["introduction-to-research", "understanding-human-behaviour", "sport-psych-1", "professional-development-psych", "research-skills-for-psych", "mind-brain-social", "sport-psych-2", "psych-prof-dev", "psych-research-project", "prof-learn-work", "sport-psych-3", "optional-modules"]
        },
        "forensic-psych": {
            title: "BSc Forensic Psychology",
            description: "The BSc (Hons) Forensic Psychology at Leeds Trinity University offers a comprehensive exploration of psychology within the context of the criminal justice system. Accredited by the British Psychological Society (BPS), this program equips students with the theoretical knowledge and practical skills required to understand criminal behavior, assess individuals, and implement rehabilitation strategies. Throughout the course, students engage with key areas such as offender profiling, ethical considerations, mental health, and the psychological evaluation of offenders. The program combines classroom learning with hands-on experience, including placements and professional development modules, ensuring graduates are well-prepared for further study or a career in forensic psychology and related fields. We also offer an MSc Forensic Psychology postgraduate course, if our students want to continue their studies. Please see below for a brief introduction to each module:",
            modules: ["introduction-to-research", "understanding-human-behaviour", "forensic-psych", "professional-development-psych", "research-skills-for-psych", "mind-brain-social", "forensic-psych-2", "psych-prof-dev", "psych-research-project", "prof-learn-work", "forensic-psych-3", "optional-modules"]
        },
        "child-dev": {
            title: "BSc Psychology and Child Development",
            description: "The BSc Psychology and Child Development programme at Leeds Trinity University focuses on providing a comprehensive understanding of psychology, with a specific emphasis on child and educational psychology. It combines theoretical and practical knowledge, preparing students for careers in various psychology-related fields. Below are the unique modules in the programme, along with a brief description and information on their assessments:",
            modules: ["introduction-to-research", "understanding-human-behaviour", "developmental-psych", "professional-development-psych", "research-skills-for-psych", "mind-brain-social", "developmental-psych-2", "psych-prof-dev", "psych-research-project", "prof-learn-work", "developmental-psych-3", "optional-modules"]
        }
    };

    // Module information (some modules are shared across multiple programmes)
    const modules = {
        "understanding-human-behaviour": {
            title: "Understanding Human Behaviour (Level 4, first year)",
            description: "This module explores the fundamental principles of psychology, examining human behavior from biological, social, and developmental perspectives. Students learn how psychological theories are applied to understand and influence behavior in various contexts.",
            assignments: "Two portfolios exploring key psychological theories and concepts, followed by a capstone assessment integrating the learned material.",
            shared: true
        },
        "mind-brain-social": {
            title: "Mind, Brain, and Social Behaviour (Level 5, second year)",
            description: "This module examines the relationships between the mind, brain, and social behavior, exploring cognitive processes, neuroscience, and the influence of social dynamics on psychological functioning.",
            assignments: "A critical essay evaluating the relationship between cognitive processes, neuroscience, and social behavior through case studies and theoretical frameworks.",
            shared: true
        },
        "optional-modules": {
            title: "Optional Modules (Level 6, third year)",
            description: "In addition to core modules, students have the opportunity to diversify their degree by choosing from a range of optional modules that align with their interests and career goals. These options allow students to tailor their learning experience and deepen their knowledge in specific areas of psychology. While available modules may vary each year, here are a few options offered this year: Biopsychology of Stress and Illness, Health Behaviour Change in Context, Cyberpsychology, and Forensic Psychology.",
            assignments: "Assignments do vary by module, but may include: reports, essays, posters, and presentations",
            shared: true
        },
        "professional-development-psych": {
            title: "Professional Development for Psychologists (Level 4, first year)",
            description: "This module focuses on developing practical and professional skills relevant to psychology careers. It includes opportunities for volunteering or professional challenges, helping students to gain experience and build a professional identity in the field.This module focuses on developing practical and professional skills relevant to psychology careers. It includes opportunities for volunteering or professional challenges, helping students to gain experience and build a professional identity in the field.",
            assignments: "A group presentation on a relevant psychological topic and participation in a professional challenge project or volunteering, assessed on a pass/fail basis.",
            shared: true
        },
        "psych-prof-dev": {
            title: "Psychology Professional Development and Work Based Experience (Level 5, second year)",
            description: "This module allows students to engage in professional placements, where they apply psychological knowledge in real-world settings. It supports career development and provides hands-on experience in different psychological contexts.",
            assignments: "A placement report where students reflect on their professional development and learning experiences within a work setting.",
            shared: true
        },
        "prof-learn-work": {
            title: "Professional Learning Through Work (Level 6, third year)",
            description: "This module involves work-based learning, allowing students to gain practical experience in a professional setting. It enhances their understanding of psychology in the workplace and develops their employability skills.",
            assignments: "A work-based learning report that integrates psychological theory and professional experiences from a practical placement.",
            shared: true
        },
        "introduction-to-research": {
            title: "Introduction to Research Skills for Psychologists (Level 4, first year)",
            description: "This module introduces students to essential research methodologies used in psychology, focusing on both quantitative and qualitative approaches. It equips students with skills in data collection, analysis, and interpretation, laying the groundwork for future research projects.",
            assignments: "A quantitative research report and a qualitative portfolio, each demonstrating the student's ability to collect, analyze, and interpret psychological data.",
            shared: true
        },
        "research-skills-for-psych": {
            title: "Research Skills for Psychologists: Quantitative and Qualitative Approaches (Level 5, second year)",
            description: "Building on the foundations laid in Level 4, this module provides advanced training in research methodologies, focusing on the application of statistical and qualitative techniques to psychological research.",
            assignments: "A research report applying both quantitative and qualitative methodologies to explore a psychological research question.",
            shared: true
        },
        "psych-research-project": {
            title: "Psychology Research Project (Level 6, third year)",
            description: "In this module, students undertake an independent research project, applying their knowledge and skills to explore a psychological topic of their choice. This capstone project demonstrates their ability to conduct research and contribute to the field of psychology.",
            assignments: "An independent research project, where students design, conduct, and report a comprehensive study on a psychological topic of their choice.",
            shared: true
        },
        "intro-to-counselling": {
            title: "Introduction to Counselling Psychology  (Level 4, first year)",
            description: "Students are introduced to the core concepts of counselling psychology, including key therapeutic approaches and the role of self-reflection in professional practice. This module emphasizes developing a reflective understanding of personal and professional growth.",
            assignments: "An essay on foundational counselling theories and a reflective diary examining the student's personal and professional development.",
            shared: false
        },
        "counselling-theory-practice": {
            title: "Counselling Psychology in Theory and Practice (Level 5, second year)",
            description: "Students deepen their understanding of counselling psychology by studying various therapeutic approaches in practice. The module emphasizes ethical practice, client-therapist relationships, and the integration of theory into real-world scenarios.",
            assignments: "A reflective essay and a case analysis that apply counselling techniques and evaluate therapeutic approaches in practice.",
            shared: false
        },
        "applied-counselling-psych": {
            title: "Applied Counselling Psychology (Level 6, third year)",
            description: "This module focuses on the practical application of counselling psychology, exploring interventions and therapeutic techniques. Students learn how to tailor psychological approaches to meet the diverse needs of clients in various contexts.",
            assignments: "A case study analysis and reflective essay, where students apply counselling theories to practical scenarios, demonstrating their understanding of therapeutic interventions.",
            shared: false
        },
        "developmental-psych": {
            title: "Introduction to Child and Educational Psychology  (Level 4, first year)",
            description: "In this module we take a deep dive into understanding foundational concepts in child and educational psychology. We begin by looking at how children develop during in their first few years of life. We then turn to look at some key theories of psychology and how they we can apply them in an educational context. Finally, we explore some current debates in educational psychology around how best to identify and support students with additional needs.",
            assignments: "Students will write an essay exploring key theories and practices in child and educational psychology (50%) and deliver a group presentation critically examining a contemporary issue or debate in child psychology.",
            shared: false
        },
        "developmental-psych-2": {
            title: "Child and Educational Psychology in Theory and Practice (Level 5, second year)",
            description: "In this module we focus on two areas where educational psychology has made significant advances. We begin by looking at how children develop academic skills and abilities and why some children are not able to do this as easily as others, with a strong focus on development in maths and reading. Next, we turn to look at how broader psychological factors such as metacognition influence the way children and adults engage with education. Our journey through these areas is embedded in developing our knowledge, practice, and application of reflective practice - a key skill for all practitioners. You'll apply psychological theory, research, and legislation to case study scenarios, allowing you to identify strategies to support children and young people and enhance the practices of those working alongside them.",
            assignments: "Students will analyze a case study focusing on the development of academic skills, such as reading or mathematics (50%) and present an analysis of broader psychological factors, like metacognition, that influence learning and development (50%).",
            shared: false
        },
        "developmental-psych-3": {
            title: "Applied Child and Educational Psychology (Level 6, third year)",
            description: "In this module we will explore the role of wider society, educational psychologists, and other school-based practitioners in supporting children’s wider development, from developing socioemotional skills to ensuring their wellbeing. We will be asking questions like: 'Are schools a good place to address child mental health issues?', 'How can schools improve pupil wellbeing?', and 'What evidence is there that school-based interventions work?'. Throughout the module you will get the chance to put yourself in the shoes of an educational psychologist, drawing on psychological ideas and new research to suggest strategies to support those in education settings. You’ll also get to meet members of our wider psychology team, learning how they apply their specialist knowledge areas to supporting children’s development in a variety of contexts.",
            assignments: "Students will write a comprehensive essay evaluating the role of educational psychologists and other practitioners in supporting child development (50%), and working together to present a case study or an intervention strategy to support children and young people in educational settings.",
            shared: false
        },
        "forensic-psych": {
            title: "Introduction to Child and Educational Psychology  (Level 4, first year)",
            description: "This module introduces students to the fundamental concepts of forensic psychology, exploring the role of psychologists within the criminal justice system. It covers key areas such as criminal behavior, profiling, and ethical considerations in forensic practice, providing a foundation for further study in the field.",
            assignments: "An essay (50%) examining foundational forensic psychology theories and a negotiated ethics assessment (50%) evaluating ethical considerations in practice.",
            shared: false
        },
        "forensic-psych-2": {
            title: "Child and Educational Psychology in Theory and Practice (Level 5, second year)",
            description: "This module delves deeper into the application of forensic psychology theories in real-world settings. Students examine offender behavior, rehabilitation strategies, and the psychological assessment of individuals within legal and correctional contexts, enhancing their practical understanding of forensic interventions.",
            assignments: "An essay and a case analysis, applying forensic psychological techniques and evaluating interventions.",
            shared: false
        },
        "forensic-psych-3": {
            title: "Applied Child and Educational Psychology (Level 6, third year)",
            description: "In this advanced module, students apply their knowledge to complex forensic cases, focusing on intervention strategies, risk assessment, and the evaluation of rehabilitation programs. The module emphasizes critical thinking and reflective practice, preparing students for professional roles in forensic psychology.",
            assignments: "A case study analysis and reflective essay applying forensic psychology principles to real-world scenarios.",
            shared: false
        },
        "contemp-psych-1": {
            title: "Contemporary Issues in Psychology 1 (Level 4, first year)",
            description: "This module introduces our students to current and emerging topics in psychology. Students will explore several different and evolving topics throughout the year, including: Mental Health Awareness and Stigma, Impact of Technology on Wellbeing, Social Identity and Group dynamics.",
            assignments: "It includes a written assignment and a poster presentation, each contributing 50% to the overall grade. Students engage with contemporary research and discussions, applying foundational psychology knowledge to understand modern issues.",
            shared: false
        },
        "contemp-psych-2": {
            title: "Contemporary Issues in Psychology 2 (Level 5, second year)",
            description: "This advanced module delves into more specialized and complex psychological topics, building on what was learned in Level 4. Possible areas include: Psychological Impacts of AI, Advances in Trauma and PTSD Treatment, Gender Identity and Sexuality, Cross-Cultural Psychology and Globalization.",
            assignments: "Students will produce a written piece of work analyzing a contemporary issue of choice integrating research findings and theoretical perspectives. They will also complete a poster or presentation communicating their findings effectively.",
            shared: false
        },
        "sport-psych-1": {
            title: "Applied Child and Educational Psychology (Level 6, third year)",
            description: "This module introduces the foundational principles of sport psychology. It covers key psychological theories and their application to sport and exercise settings, helping students understand how psychological factors influence performance, motivation, and well-being in athletes. Topics may include goal setting, mental preparation, motivation techniques, and the role of the sport psychologist in enhancing performance and well-being.",
            assignments: "Two Negotiated Assessments, each contributing 50% of the module grade. These assessments may involve projects, presentations, or written work where students apply principles of sport psychology to real-world or simulated scenarios.",
            shared: false
        },
        "sport-psych-2": {
            title: "Contemporary Issues in Psychology 1 (Level 4, first year)",
            description: "This module focuses on the practical skills needed to work effectively with various stakeholders in sport settings, such as athletes, coaches, and sport organizations. Students learn about consulting skills, psychological interventions, and communication strategies essential for sport psychologists. The module emphasizes building professional relationships and understanding the ethical considerations involved in sport psychology practice.",
            assignments: "Assessments may include case studies, reflective reports, or simulated consultations, where students demonstrate their ability to apply sport psychology principles in collaborative and professional contexts with stakeholders.",
            shared: false
        },
        "sport-psych-3": {
            title: "Contemporary Issues in Psychology 2 (Level 5, second year)",
            description: "This advanced module explores the application of sport psychology principles in diverse contexts, such as professional sports teams, individual athletes, and community sports settings. It includes a critical evaluation of case studies, intervention strategies, and contemporary issues in sport psychology. Students develop a sophisticated understanding of how psychological factors can impact performance, well-being, and development across different populations and levels of sport participation.",
            assignments: "This module might involve case analysis, intervention planning, and applied research projects, allowing students to critically evaluate and apply their knowledge of sport psychology to various real-world and simulated scenarios.",
            shared: false
        },
        "foundation-psych": {
            title: "Foundations in Psychology",
            description: "This module introduces students to the fundamental concepts and theories of psychology. It covers a range of topics, including basic cognitive processes, social and developmental psychology, and the biological foundations of behavior. The aim is to provide a comprehensive understanding of how psychological principles can be applied to understand human behavior. Students engage in critical thinking, reflecting on how these principles relate to real-world situations.",
            assignments: "A portfolio of students undersatnding of psychological theories and their application (50%), group poster presentation exploring a psychological topic in depth",
            shared: false
        },
        "research-apply-psych": {
            title: "Researching and Applying Psychology",
            description: "This module focuses on developing essential research skills within the context of psychology. Students learn about different research methods, data collection techniques, and ethical considerations in psychological research. They also practice applying these methods in real-world scenarios, gaining hands-on experience in designing and conducting psychological studies.",
            assignments: "A group poster presentation that challenges students to work collaboratively to present research findings visually and effectively (50%), and a portfolio that includes individual work demonstrating an understanding of research methodologies and their application in psychology.",
            shared: false
        },
        "psychology-project": {
            title: "Psychology Project",
            description: "The Psychology Project module provides students with the opportunity to apply their knowledge and skills to a small-scale independent research project. Students choose a topic of interest, develop a project plan, and carry out the project under the guidance of their tutors. This module is designed to enhance students' research capabilities and critical thinking skills, preparing them for more advanced research tasks in later years.",
            assignments: "Students will complete a project plan where they outline their research approach and methodology (30%), final project which involves presenting their findings in a written report, demonstrating their ability to conduct and analyze psychological research (70%).",
            shared: false
        },
        "academic-skills": {
            title: "Academic Skills and Studying with Confidence",
            description: "This module aims to equip students with the skills needed to succeed in higher education. It covers academic writing, critical reading, and reflective thinking, helping students to develop effective study habits. The module also includes training on time management and organizational skills, ensuring that students are prepared for the academic challenges of their degree programme.",
            assignments: "A negotiated assessment that may involve different forms of work (e.g. presentations or essays) tailored to the individual learning goals (50%), a reflective essay that encourages students to apply their academic skills and reflect on their learning process.",
            shared: false
        }
    };

        function createProgrammeButtons() {
            const programmeButtonsContainer = document.createElement("div");
    programmeButtonsContainer.classList.add("programme-buttons");

    // Iterate over programme details to create buttons
    for (const key in programmeDetails) {
        if (programmeDetails.hasOwnProperty(key)) {
            const button = document.createElement("button");
            button.classList.add("programme-option");
            button.id = key;
            button.textContent = programmeDetails[key].title;
            programmeButtonsContainer.appendChild(button);
        }
    }

    // Append the buttons container to the main content
    mainContent.appendChild(programmeButtonsContainer);

    // Add event listeners to the buttons
    addProgrammeButtonListeners();
}

    function updateMainContent(title, description, moduleIds = []) {
        let uniqueModulesHTML = "";
        let sharedModulesHTML = "";

        if (moduleIds.length) {
            moduleIds.forEach(moduleId => {
                const module = modules[moduleId]; // Access the module object
                if (module) { // Ensure the module exists
                    const moduleSection = createModuleSection(moduleId);

                    if (module.shared) { // Check if the module is shared
                        sharedModulesHTML += moduleSection;
                    } else {
                        uniqueModulesHTML += moduleSection;
                    }
                }
            });
        }

        mainContent.innerHTML = `
            <h2>${title}</h2>
            <p>${description}</p>
            <h3>Unique Programme Modules</h3>
            ${uniqueModulesHTML || "<p>No unique modules available for this programme.</p>"}
            <h3>Shared Modules</h3>
            ${sharedModulesHTML || "<p>No shared modules available for this programme.</p>"}
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
    
    

    function loadIntroContent() {
        mainContent.innerHTML = `
            <h2>${introContent.title}</h2>
            <p>${introContent.description}</p>
        `;

        // After loading intro content, create the programme buttons
        createProgrammeButtons();
    }

    function addProgrammeButtonListeners() {
        const newProgrammeButtons = document.querySelectorAll(".programme-option");
        newProgrammeButtons.forEach(button => {
            button.addEventListener("click", () => {
                const programmeId = button.id;
                const programmeInfo = programmeDetails[programmeId];

                if (programmeInfo) {
                    updateMainContent(programmeInfo.title, programmeInfo.description, programmeInfo.modules);
                }

                setInactivityTimeout();
            });
        });
    }

    function createModuleSection(moduleId) {
        const module = modules[moduleId];
        return `
            <div class="module">
                <button class="collapsible">${module.title}</button>
                <div class="module-content">
                    <p>${module.description}</p>
                    ${module.assignments ? `<h3>Assessments</h3><p>${module.assignments}</p>` : ""}
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

    // Load the introductory content when the page loads
    loadIntroContent();

// Start the inactivity timer when the page loads
setInactivityTimeout();
});