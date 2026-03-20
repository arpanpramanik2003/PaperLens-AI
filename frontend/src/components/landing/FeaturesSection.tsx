import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText, Lightbulb, FlaskConical, Search, CheckCircle2, Zap, Brain } from "lucide-react";

const ease = [0.2, 0, 0, 1] as const;

const features = [
  {
    id: 0,
    icon: FileText,
    title: "Paper Analyzer",
    desc: "Upload any research paper and get comprehensive, structured insights instantly. Our AI extracts key information including methodology, results, limitations, and innovative concepts to accelerate your understanding.",
    highlights: ["Instant summarization", "Methodology extraction", "Results visualization"],
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: 1,
    icon: Lightbulb,
    title: "Problem Statement Generator",
    desc: "Transform your research interests into concrete problem statements. Generate innovative research ideas from your domain with AI-powered creativity and get actionable research directions.",
    highlights: ["AI-powered ideation", "Domain-relevant ideas", "Actionable research paths"],
    color: "from-amber-500 to-orange-500",
  },
  {
    id: 2,
    icon: FlaskConical,
    title: "Experiment Planner",
    desc: "Get detailed step-by-step research execution plans. Our AI designs optimal experimental workflows including datasets, models, evaluation metrics, and performance benchmarks.",
    highlights: ["Dataset recommendations", "Model selection", "Performance tracking"],
    color: "from-purple-500 to-pink-500",
  },
  {
    id: 3,
    icon: Search,
    title: "Gap Detection Engine",
    desc: "Identify unexplored research gaps in your field. Get intelligent suggestions on where to focus your efforts and discover opportunities for groundbreaking contributions.",
    highlights: ["Gap identification", "Opportunity analysis", "Research suggestions"],
    color: "from-green-500 to-emerald-500",
  },
  {
    id: 4,
    icon: Brain,
    title: "Dataset & Benchmark Finder",
    desc: "Discover optimal datasets and benchmarks for your research projects. Get intelligent recommendations tailored to your specific research needs and domain.",
    highlights: ["Dataset discovery", "Benchmark recommendations", "Domain matching"],
    color: "from-indigo-500 to-blue-500",
  },
];

// Random content generator
const randomProjects = [
  { name: "Deep Learning for Medical Imaging", summary: "Novel CNN architecture for early disease detection", problem: "Improve diagnostic accuracy in X-ray analysis", methodology: "Transfer learning with ResNet-50 backbone" },
  { name: "Natural Language Processing for Code", summary: "AI model understanding programming patterns", problem: "Automate code review and optimization", methodology: "Transformer-based sequence-to-sequence learning" },
  { name: "Quantum Computing Applications", summary: "Quantum algorithms for optimization problems", problem: "Reduce computational complexity of NP-hard problems", methodology: "Variational quantum eigensolver implementation" },
  { name: "EdgeAI for IoT Devices", summary: "Lightweight models for embedded systems", problem: "Deploy AI on resource-constrained hardware", methodology: "Model quantization and pruning techniques" },
  { name: "Blockchain Security Analysis", summary: "Vulnerability detection in smart contracts", problem: "Identify and prevent contract exploits", methodology: "Static analysis with machine learning" },
];

const randomQuestions = [
  { q: "What's the main contribution of this paper?", a: "This work proposes a novel approach to tackle scalability issues while maintaining state-of-the-art accuracy." },
  { q: "How does this compare to existing solutions?", a: "The proposed method achieves 23% faster processing with 15% higher accuracy compared to baseline approaches." },
  { q: "What datasets were used in experiments?", a: "The study uses publicly available datasets including CIFAR-10, ImageNet, and custom annotated data." },
  { q: "What are the limitations mentioned?", a: "Current approach requires GPU acceleration and struggles with real-time inference on edge devices." },
  { q: "What's the future direction?", a: "Next steps involve model optimization for mobile deployment and exploring federated learning approaches." },
];

// Problem Generator data
const domains = ["Deep Learning", "Natural Language Processing", "Computer Vision", "Reinforcement Learning", "Graph Neural Networks"];
const subdomains = {
  "Deep Learning": ["Medical Imaging", "Audio Processing", "Time Series", "3D Vision"],
  "Natural Language Processing": ["Machine Translation", "Question Answering", "Sentiment Analysis", "Text Summarization"],
  "Computer Vision": ["Object Detection", "Segmentation", "Face Recognition", "Scene Understanding"],
  "Reinforcement Learning": ["Game AI", "Robotics", "Autonomous Driving", "Resource Allocation"],
  "Graph Neural Networks": ["Social Networks", "Molecule Prediction", "Knowledge Graphs", "Recommendation Systems"],
};

const researchIdeas = [
  { title: "Adversarial Robustness in Neural Networks", desc: "Develop an AI framework utilizing adversarial training to generate synthetic data. Framework should be integrated with deep learning models.", tags: ["AdversarialNets", "DeepLearning", "MedicalImaging", "Personalization"], rating: 5 },
  { title: "Explainable Radiomics Detection", desc: "Create a deep learning-based radiomics platform with human-interpretable explanations. Featured with attention mechanisms for key region highlighting.", tags: ["Radiomics", "MedicalImaging", "Explainability", "AttentionMechanisms"], rating: 4 },
  { title: "Multi-Modal Fusion for Disease Prediction", desc: "Integrate multiple medical imaging modalities with clinical data using transformer architectures for improved diagnosis accuracy.", tags: ["MultiModal", "Fusion", "Transformers", "ClinicalAI"], rating: 5 },
  { title: "Real-time Anomaly Detection System", desc: "Build an edge-deployed anomaly detection system using quantized neural networks for resource-constrained medical devices.", tags: ["EdgeComputing", "Quantization", "RealTime", "Anomaly"], rating: 4 },
  { title: "Self-Supervised Learning for Medical Data", desc: "Develop self-supervised learning techniques to leverage unlabeled medical imaging data for pre-training robust encoders.", tags: ["SelfSupervised", "Medical", "Pretraining", "Unsupervised"], rating: 5 },
];

// Problem Generator Window Component
const ProblemGeneratorWindow = () => {
  const [ideas, setIdeas] = useState(researchIdeas.slice(0, 2));
  const selectedDomain = domains[Math.floor(Math.random() * domains.length)];
  const selectedSubdomain = subdomains[selectedDomain as keyof typeof subdomains][0];

  const handleGenerateIdeas = () => {
    const shuffled = [...researchIdeas].sort(() => Math.random() - 0.5);
    setIdeas(shuffled.slice(0, 2));
  };

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
      onMouseEnter={handleGenerateIdeas}
    >
      {/* Floating animated background elements */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-amber-500 to-orange-500 opacity-5 blur-3xl"
          animate={{ y: [0, -15, 0], x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      {/* Window frame */}
      <div className="relative backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden bg-card/40 h-full flex flex-col">
        {/* Window header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20 bg-secondary/30 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Problem Generator</span>
        </div>

        {/* Window content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Form Section */}
          <motion.div
            className="mb-6 pb-6 border-b border-border/20"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {/* Domain */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Domain</label>
                  <div className="bg-secondary/50 border border-border/30 rounded px-3 py-2 text-xs text-foreground">
                    {selectedDomain}
                  </div>
                </div>

                {/* Subdomain */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Subdomain</label>
                  <div className="bg-secondary/50 border border-border/30 rounded px-3 py-2 text-xs text-foreground">
                    {selectedSubdomain}
                  </div>
                </div>

                {/* Complexity */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1 block">Complexity</label>
                  <div className="bg-secondary/50 border border-border/30 rounded px-3 py-2 text-xs text-foreground flex items-center justify-between cursor-pointer hover:bg-secondary/70 transition-colors">
                    <span>Medium</span>
                    <span className="text-muted-foreground">▼</span>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-3.5 h-3.5" />
                Generate Ideas
              </motion.button>
            </div>
          </motion.div>

          {/* Generated Ideas */}
          <div className="space-y-3">
            {ideas.map((idea, idx) => (
              <motion.div
                key={idx}
                className="bg-secondary/30 border border-border/20 rounded-lg p-3 hover:border-amber-500/50 hover:bg-secondary/50 transition-all duration-200"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + idx * 0.1 }}
              >
                {/* Star Rating */}
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-xs ${i < idea.rating ? "text-yellow-400" : "text-muted-foreground/30"}`}>
                      ★
                    </span>
                  ))}
                </div>

                {/* Title */}
                <h4 className="text-xs font-semibold text-foreground mb-1">{idea.title}</h4>

                {/* Description */}
                <p className="text-xs text-muted-foreground leading-relaxed mb-2">{idea.desc}</p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {idea.tags.map((tag) => (
                    <span key={tag} className="text-xs px-2 py-0.5 bg-secondary/50 border border-border/30 rounded text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Action Button */}
                <motion.button
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                  whileHover={{ x: 3 }}
                >
                  Use this idea →
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Experiment Planner data
const researchTopics = ["Brain Tumor", "Cardiac Imaging", "Alzheimer's Detection", "Lung Cancer", "Diabetic Retinopathy"];
const difficultyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

const experimentSteps = [
  {
    num: 1,
    title: "Dataset Selection & Curation",
    desc: "Collect and standardize a diverse dataset from public sources (TCGA, Kaggle) and in-house medical records. Ensure dataset size is sufficient for model development (~1000 samples).",
    code: "Dataset size: 1000, Data split ratio: 0.8, 0.1, 0.1 for training, validation, and test sets",
    risk: "Risk: Data imbalance may affect model performance",
  },
  {
    num: 2,
    title: "Advanced Preprocessing & Feature Engineering",
    desc: "Apply normalization, augmentation, and custom feature extraction. Implement histogram equalization, noise reduction, and domain-specific preprocessing techniques.",
    code: "Normalization type: Z-score, Augmentation: rotation, flip, zoom",
    risk: null,
  },
  {
    num: 3,
    title: "Custom Model Architecture Design",
    desc: "Design a hybrid CNN-based architecture combining transfer learning with custom layers. Implement attention mechanisms for interpretability.",
    code: "Base model: ResNet-50, Custom layers: 3, Attention: MultiHeadAttention",
    risk: null,
  },
  {
    num: 4,
    title: "Training Logic & Optimization",
    desc: "Configure training with appropriate loss functions, optimizers, and learning rate scheduling. Implement early stopping and model checkpointing.",
    code: "Optimizer: Adam, LR: 0.001, Batch size: 32, Epochs: 100",
    risk: null,
  },
  {
    num: 5,
    title: "Evaluation & Validation",
    desc: "Perform comprehensive evaluation using precision, recall, F1-score, and ROC-AUC metrics. Generate confusion matrices and ablation studies.",
    code: "Metrics: Precision, Recall, F1, ROC-AUC, Specificity",
    risk: null,
  },
];

// Experiment Planner Window Component
const ExperimentPlannerWindow = () => {
  const [steps, setSteps] = useState(experimentSteps.slice(0, 4));
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const topic = researchTopics[Math.floor(Math.random() * researchTopics.length)];
  const difficulty = difficultyLevels[Math.floor(Math.random() * difficultyLevels.length)];

  const handleGeneratePlan = () => {
    const shuffled = [...experimentSteps].sort(() => Math.random() - 0.5);
    setSteps(shuffled.slice(0, 4));
    setExpandedStep(0);
  };

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
      onMouseEnter={handleGeneratePlan}
    >
      {/* Floating animated background elements */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 opacity-5 blur-3xl"
          animate={{ y: [0, -15, 0], x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      {/* Window frame */}
      <div className="relative backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden bg-card/40 h-full flex flex-col">
        {/* Window header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20 bg-secondary/30 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Experiment Planner</span>
        </div>

        {/* Window content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {/* Form Section */}
          <motion.div
            className="mb-6 pb-6 border-b border-border/20"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="space-y-3">
              {/* Research Topic */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Research Topic</label>
                <div className="bg-secondary/50 border border-border/30 rounded px-3 py-2.5 text-xs text-foreground">
                  {topic}
                </div>
              </div>

              {/* Difficulty Level */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Difficulty Level</label>
                <div className="bg-secondary/50 border border-border/30 rounded px-3 py-2.5 text-xs text-foreground flex items-center justify-between cursor-pointer hover:bg-secondary/70 transition-colors">
                  <span>{difficulty}</span>
                  <span className="text-muted-foreground text-xs">▼</span>
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold flex items-center gap-2 transition-colors w-full sm:w-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-3.5 h-3.5" />
                Generate Plan
              </motion.button>
            </div>
          </motion.div>

          {/* Experiment Steps */}
          <div className="space-y-2 flex-1">
            {steps.map((step, idx) => (
              <motion.div
                key={step.num}
                className="border border-border/20 rounded-lg overflow-hidden bg-secondary/20 hover:border-purple-500/30 transition-colors"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.05 }}
              >
                {/* Step Header */}
                <motion.button
                  onClick={() => setExpandedStep(expandedStep === step.num ? null : step.num)}
                  className="w-full flex items-start gap-3 p-3 hover:bg-secondary/40 transition-colors text-left"
                  whileHover={{ backgroundColor: "rgba(139, 92, 246, 0.08)" }}
                >
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-500/30 border border-purple-500/50 flex-shrink-0 mt-0.5 text-xs font-semibold text-purple-300">
                    {step.num}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xs font-semibold text-foreground">{step.title}</h4>
                  </div>
                  <motion.span
                    animate={{ rotate: expandedStep === step.num ? 180 : 0 }}
                    className="text-muted-foreground flex-shrink-0"
                  >
                    ▼
                  </motion.span>
                </motion.button>

                {/* Step Content */}
                <motion.div
                  initial={false}
                  animate={{ height: expandedStep === step.num ? "auto" : 0, opacity: expandedStep === step.num ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 pt-0 space-y-2 bg-secondary/10 border-t border-border/10">
                    <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>

                    {step.code && (
                      <div className="bg-secondary/50 rounded px-2.5 py-1.5 font-mono text-xs text-purple-300">
                        {step.code}
                      </div>
                    )}

                    {step.risk && (
                      <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded px-2.5 py-1.5">
                        <Zap className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-red-300">{step.risk}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Dataset & Benchmark Finder data
const projectTitles = ["Brain Tumor", "Alzheimer's Detection", "COVID-19 Detection", "Diabetic Retinopathy", "Cancer Classification"];

const datasetsData = [
  { name: "Brain Tumor Segmentation (BraTS)", rating: 4.5, desc: "Contains 3D MRI scans for brain tumor segmentation", tags: ["Tumor segmentation", "Volume estimation"] },
  { name: "TCGA - Brain Tumors Segmentation", rating: 4.5, desc: "Radiosurgery DICOM and MRI scans with segmentation labels", tags: ["Radiosurgery extraction", "Tumor volume estimation"] },
  { name: "Cancer Genome Atlas (TCGA) - Brain", rating: 4.5, desc: "Genomic data, clinical data, and histology data of brain tumors", tags: ["Genomic analysis", "Tumor subtype classification"] },
  { name: "Harvard's Brain Tumor Dataset", rating: 4.3, desc: "Contains 3D MRI scans with segmentation labels and clinical data", tags: ["Tumor segmentation", "Volume estimation"] },
  { name: "Brain Tumor Segmentation Challenge 2019", rating: 4.0, desc: "Contains 3D MRI scans for brain tumor segmentation evaluation", tags: ["Tumor segmentation evaluation"] },
  { name: "MRIBrainS Challenge", rating: 4.0, desc: "Contains 3D MRI scans for brain tumor segmentation evaluation", tags: ["Tumor segmentation evaluation"] },
];

const benchmarksData = [
  { name: "Dice Similarity Coefficient (DSC)", rating: 4.5, desc: "Evaluates overlap between predicted and actual tumor masks", tags: [] },
  { name: "Hausdorff Distance", rating: 4.5, desc: "Evaluates the distance between predicted and actual tumor contours", tags: [] },
  { name: "Volume-based benchmark", rating: 4.3, desc: "Evaluates the accuracy of predicted tumor volume", tags: [] },
];

const domainDescriptions = [
  "Medical image analysis for diagnosis and treatment of brain tumors.",
  "Deep learning models for automated lesion detection in CT scans.",
  "AI-powered pathology image analysis for cancer screening.",
];

// Dataset & Benchmark Finder Window Component
const DatasetBenchmarkWindow = () => {
  const [projectTitle, setProjectTitle] = useState("");
  const [projectPlan, setProjectPlan] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [datasets, setDatasets] = useState<typeof datasetsData>([]);
  const [benchmarks, setBenchmarks] = useState<typeof benchmarksData>([]);
  const domainDesc = domainDescriptions[Math.floor(Math.random() * domainDescriptions.length)];
  const defaultTitle = projectTitles[Math.floor(Math.random() * projectTitles.length)];

  const handleFindDatasets = () => {
    setProjectTitle(defaultTitle);
    const selectedDatasets = [...datasetsData].sort(() => Math.random() - 0.5).slice(0, 3);
    const selectedBenchmarks = [...benchmarksData].sort(() => Math.random() - 0.5).slice(0, 3);
    setDatasets(selectedDatasets);
    setBenchmarks(selectedBenchmarks);
    setShowResults(true);
  };

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
      onMouseEnter={handleFindDatasets}
    >
      {/* Floating animated background elements */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 to-blue-500 opacity-5 blur-3xl"
          animate={{ y: [0, -15, 0], x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      {/* Window frame */}
      <div className="relative backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden bg-card/40 h-full flex flex-col">
        {/* Window header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20 bg-secondary/30 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Dataset Finder</span>
        </div>

        {/* Window content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {!showResults ? (
            <>
              {/* Form Section */}
              <motion.div
                className="space-y-3 mb-4"
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                {/* Project Title */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Project Title</label>
                  <input
                    type="text"
                    placeholder="Brain tumor"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full bg-secondary/50 border border-border/30 rounded px-3 py-2 text-xs text-foreground focus:outline-none focus:border-blue-500/50"
                  />
                </div>

                {/* Project Plan */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Project Plan (Optional)</label>
                  <textarea
                    placeholder="Paste your full project plan, methodology, objectives, and expected outcomes..."
                    value={projectPlan}
                    onChange={(e) => setProjectPlan(e.target.value)}
                    className="w-full bg-secondary/50 border border-border/30 rounded px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50 h-20 resize-none"
                  />
                  <div className="mt-2 flex justify-end">
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                </div>

                {/* Find Button */}
                <motion.button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Search className="w-3.5 h-3.5" />
                  Find Datasets & Benchmarks
                </motion.button>
              </motion.div>
            </>
          ) : (
            <>
              {/* Domain Understanding */}
              <motion.div
                className="mb-4 pb-4 border-b border-border/20"
                initial={{ opacity: 0, y: -10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
              >
                <p className="text-xs text-blue-400 font-semibold mb-1">DOMAIN UNDERSTANDING</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{domainDesc}</p>
              </motion.div>

              {/* Recommended Datasets */}
              <motion.div
                className="mb-4 pb-4 border-b border-border/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <h3 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  Recommended Datasets
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {datasets.map((dataset, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-secondary/30 border border-border/20 rounded p-2 hover:border-blue-500/30 transition-colors"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + idx * 0.05 }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < Math.floor(dataset.rating) ? "text-yellow-400" : "text-muted-foreground/30"}`}>
                            ★
                          </span>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">{dataset.rating}/5</span>
                      </div>
                      <h4 className="text-xs font-semibold text-foreground mb-1 line-clamp-2">{dataset.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{dataset.desc}</p>
                      <div className="flex flex-wrap gap-1 mb-2">
                        {dataset.tags.map((tag) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-secondary/50 border border-border/30 rounded text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <motion.button
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        whileHover={{ x: 2 }}
                      >
                        View details →
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Relevant Benchmarks */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <h3 className="text-xs font-semibold text-foreground mb-2.5 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5" />
                  Relevant Benchmarks
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {benchmarks.map((benchmark, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-secondary/30 border border-border/20 rounded p-2 hover:border-blue-500/30 transition-colors"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.6 + idx * 0.05 }}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className={`text-xs ${i < Math.floor(benchmark.rating) ? "text-yellow-400" : "text-muted-foreground/30"}`}>
                            ★
                          </span>
                        ))}
                        <span className="text-xs text-muted-foreground ml-auto">{benchmark.rating}/5</span>
                      </div>
                      <h4 className="text-xs font-semibold text-foreground mb-1 line-clamp-2">{benchmark.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{benchmark.desc}</p>
                      <motion.button
                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        whileHover={{ x: 2 }}
                      >
                        View benchmark details →
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Paper Analyzer Window Component
const PaperAnalyzerWindow = () => {
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);
  const [project, setProject] = useState(randomProjects[Math.floor(Math.random() * randomProjects.length)]);
  const [question, setQuestion] = useState(randomQuestions[Math.floor(Math.random() * randomQuestions.length)]);

  const handleCardHover = () => {
    setProject(randomProjects[Math.floor(Math.random() * randomProjects.length)]);
    setQuestion(randomQuestions[Math.floor(Math.random() * randomQuestions.length)]);
  };

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
      onMouseEnter={handleCardHover}
    >
      {/* Floating animated background elements */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-500 opacity-5 blur-3xl"
          animate={{ y: [0, -15, 0], x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      {/* Window frame */}
      <div className="relative backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden bg-card/40 h-full flex flex-col">
        {/* Window header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20 bg-secondary/30 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Paper Analyzer</span>
        </div>

        {/* Window content - Split view */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left side - Analysis Result */}
          <motion.div
            className="flex-1 border-r border-border/20 p-4 overflow-y-auto"
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground mb-2">ANALYSIS RESULT</h4>
              </div>

              {/* Summary Section */}
              <motion.div
                className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredSection === "summary"
                    ? "bg-blue-500/20 border border-blue-500/50"
                    : "hover:bg-blue-500/10 border border-transparent"
                }`}
                onMouseEnter={() => setHoveredSection("summary")}
                onMouseLeave={() => setHoveredSection(null)}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <h3 className={`text-sm font-semibold mb-2 transition-colors ${
                  hoveredSection === "summary" ? "text-blue-300" : "text-blue-400"
                }`}>
                  Summary
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {project.summary}
                </p>
              </motion.div>

              {/* Problem Statement Section */}
              <motion.div
                className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredSection === "problem"
                    ? "bg-blue-500/20 border border-blue-500/50"
                    : "hover:bg-blue-500/10 border border-transparent"
                }`}
                onMouseEnter={() => setHoveredSection("problem")}
                onMouseLeave={() => setHoveredSection(null)}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5 }}
              >
                <h3 className={`text-sm font-semibold mb-2 transition-colors ${
                  hoveredSection === "problem" ? "text-blue-300" : "text-blue-400"
                }`}>
                  Problem Statement
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {project.problem}
                </p>
              </motion.div>

              {/* Methodology Section */}
              <motion.div
                className={`p-3 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredSection === "methodology"
                    ? "bg-blue-500/20 border border-blue-500/50"
                    : "hover:bg-blue-500/10 border border-transparent"
                }`}
                onMouseEnter={() => setHoveredSection("methodology")}
                onMouseLeave={() => setHoveredSection(null)}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.6 }}
              >
                <h3 className={`text-sm font-semibold mb-2 transition-colors ${
                  hoveredSection === "methodology" ? "text-blue-300" : "text-blue-400"
                }`}>
                  Methodology
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {project.methodology}
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Right side - Chat Interface */}
          <motion.div
            className="flex-1 flex flex-col p-4 bg-secondary/20"
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3 text-blue-400" />
                Chat with Paper
              </h4>
              <span className="text-xs text-muted-foreground">This Document</span>
            </div>

            {/* Chat messages */}
            <div className="flex-1 space-y-3 overflow-y-auto mb-3">
              {/* User message */}
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.5 }}
              >
                <div className="bg-blue-500/30 rounded-lg px-3 py-2 max-w-[70%]">
                  <p className="text-xs text-foreground">
                    {question.q}
                  </p>
                </div>
              </motion.div>

              {/* AI response */}
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.6 }}
              >
                <div className="bg-secondary/50 rounded-lg px-3 py-2 max-w-[70%]">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground">
                      {question.a}
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Input area */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about this paper..."
                className="flex-1 bg-secondary/50 border border-border/30 rounded px-2 py-1.5 text-xs text-muted-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-blue-500/50"
                disabled
              />
              <motion.button
                className="bg-blue-500/80 hover:bg-blue-500 text-white rounded p-1.5 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Zap className="w-3 h-3" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

// Gap Detection Engine data
const projectDescriptions = [
  "Design and development of a medical decision support system using deep reinforcement learning algorithms to generate adversarial examples, while integrating attention-based explainability methods for improved model interpretability. Our proposed approach would allow clinicians to understand the model's decision-making process, thereby enhancing trust and confidence in the system's recommendations.",
  "Development of an AI framework for autonomous vehicle navigation using multi-modal sensor fusion. The system integrates LiDAR, camera, and radar data through a transformer-based architecture with real-time decision making capabilities.",
  "Creation of a personalized cancer treatment recommendation engine using graph neural networks and federated learning to preserve patient privacy while improving treatment outcomes across distributed healthcare systems.",
];

const detectedGaps = [
  {
    title: "Lack of Adversarial Robustness Evaluation",
    severity: "Critical",
    desc: "The proposed method relies on generating adversarial examples, but the paper fails to investigate the system's robustness against diverse types of attacks, such as white-box, black-box, and transferability attacks. This omission makes it difficult to determine the system's reliability in real-world clinical settings.",
    action: "Conduct and conduct experiments to evaluate the system's robustness against various types of adversarial attacks and explore the use of techniques like differential privacy or generative adversarial networks to improve robustness.",
  },
  {
    title: "Insufficient Evaluation of Attention-Based Explainability",
    severity: "High",
    desc: "The proposed attention-based explainability method is demonstrated, but the paper lacks a comprehensive evaluation of its effectiveness in explaining model decisions, particularly in scenarios where multiple factors contribute to the final prediction.",
    action: "Conduct a thorough analysis of the attention weights and use techniques like feature importance or SHAP values to assess the method's ability to uncover relevant relationships between input features and predictions.",
  },
  {
    title: "Inadequate Comparison with Existing Medical Decision Support Systems",
    severity: "High",
    desc: "The paper does not provide a systematic comparison with existing medical decision support systems, which makes it challenging to assess the novelty and effectiveness of the proposed approach.",
    action: "Conduct a thorough review of existing medical decision support systems and compare the proposed method's performance, explainability, and robustness with these systems using standardized evaluation metrics.",
  },
  {
    title: "Missing Privacy & Safety Analysis",
    severity: "Medium",
    desc: "While the model is designed for clinical use, there is no discussion of privacy-preserving techniques, HIPAA compliance, or safety measures for deployment in real healthcare environments.",
    action: "Implement privacy-preserving mechanisms and conduct a thorough security audit before deployment in clinical settings.",
  },
  {
    title: "Limited Dataset Diversity",
    severity: "Medium",
    desc: "The evaluation is performed on limited datasets from a single medical institution, which may not represent the global patient population.",
    action: "Validate the approach on publicly available diverse datasets and perform cross-institutional validation studies.",
  },
];

// Gap Detection Engine Window Component
const GapDetectionWindow = () => {
  const [activeTab, setActiveTab] = useState<"project" | "paper">("project");
  const [gapsDetected, setGapsDetected] = useState<typeof detectedGaps | null>(null);
  const projectContent = projectDescriptions[Math.floor(Math.random() * projectDescriptions.length)];

  const handleDetectGaps = () => {
    const randomGaps = [...detectedGaps].sort(() => Math.random() - 0.5).slice(0, 5);
    setGapsDetected(randomGaps);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "text-red-400";
      case "High":
        return "text-yellow-400";
      case "Medium":
        return "text-blue-400";
      default:
        return "text-green-400";
    }
  };

  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
      onMouseEnter={handleDetectGaps}
    >
      {/* Floating animated background elements */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 opacity-10 blur-3xl"
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr from-green-500 to-emerald-500 opacity-5 blur-3xl"
          animate={{ y: [0, -15, 0], x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      {/* Window frame */}
      <div className="relative backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden bg-card/40 h-full flex flex-col">
        {/* Window header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20 bg-secondary/30 flex-shrink-0">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Gap Detection</span>
        </div>

        {/* Window content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col">
          {/* Tab Section */}
          <motion.div
            className="flex gap-2 mb-4 pb-4 border-b border-border/20"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <motion.button
              onClick={() => setActiveTab("project")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === "project"
                  ? "bg-blue-500/30 border border-blue-500/50 text-blue-300"
                  : "bg-secondary/30 border border-border/30 text-muted-foreground hover:bg-secondary/50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="w-3.5 h-3.5" />
              Project Plan
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("paper")}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-semibold transition-all ${
                activeTab === "paper"
                  ? "bg-blue-500/30 border border-blue-500/50 text-blue-300"
                  : "bg-secondary/30 border border-border/30 text-muted-foreground hover:bg-secondary/50"
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FileText className="w-3.5 h-3.5" />
              Upload Paper
            </motion.button>
          </motion.div>

          {/* Content Display */}
          <motion.div
            className="mb-4 p-3 bg-secondary/20 border border-border/20 rounded text-xs text-muted-foreground leading-relaxed min-h-24"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {projectContent}
            <div className="mt-3 flex justify-end">
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
          </motion.div>

          {/* Detect Gaps Button */}
          <motion.button
            className="mb-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-xs font-semibold flex items-center justify-center gap-2 transition-colors w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Search className="w-3.5 h-3.5" />
            Detect Gaps
          </motion.button>

          {/* Gaps Report */}
          {gapsDetected && (
            <motion.div
              className="space-y-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {/* Report Header */}
              <div className="flex items-center justify-between py-2 border-b border-border/20">
                <span className="text-xs text-muted-foreground font-semibold">
                  {gapsDetected.length} gaps identified
                </span>
                <motion.button
                  className="text-xs text-green-400 hover:text-green-300 flex items-center gap-1 transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  <FileText className="w-3 h-3" />
                  Copy Report
                </motion.button>
              </div>

              {/* Gap Items */}
              <div className="space-y-3">
                {gapsDetected.map((gap, idx) => (
                  <motion.div
                    key={idx}
                    className="bg-secondary/30 border border-border/20 rounded-lg p-3 hover:border-green-500/30 transition-colors"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    {/* Gap Title with Severity */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-xs font-semibold text-foreground flex-1">{gap.title}</h4>
                      <span className={`text-xs font-semibold flex-shrink-0 ${getSeverityColor(gap.severity)}`}>
                        {gap.severity}
                      </span>
                    </div>

                    {/* Gap Description */}
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{gap.desc}</p>

                    {/* Recommended Action */}
                    <p className="text-xs text-blue-300 italic leading-relaxed pl-3 border-l-2 border-blue-500/50">
                      {gap.action}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

// Animated window card component for demo display (generic version for other features)
const AnimatedWindowCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  return (
    <motion.div
      className="relative w-full h-full"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
    >
      {/* Floating animated background elements */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl">
        <motion.div
          className={`absolute top-0 right-0 w-40 h-40 rounded-full bg-gradient-to-br ${feature.color} opacity-10 blur-3xl`}
          animate={{ y: [0, 20, 0], x: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.div
          className={`absolute bottom-0 left-0 w-32 h-32 rounded-full bg-gradient-to-tr ${feature.color} opacity-5 blur-3xl`}
          animate={{ y: [0, -15, 0], x: [0, 15, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
        />
      </div>

      {/* Window frame */}
      <div className="relative backdrop-blur-sm border border-border/30 rounded-2xl overflow-hidden bg-card/40">
        {/* Window header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20 bg-secondary/30">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs text-muted-foreground ml-2">PaperLens AI — Feature Demo</span>
        </div>

        {/* Window content */}
        <div className="p-6">
          {/* Feature icon animation */}
          <motion.div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} mb-4`}
            animate={{ scale: [1, 1.05, 1], rotate: [0, 2, -2, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
          </motion.div>

          {/* Highlight items with staggered animation */}
          <div className="space-y-3 mt-4">
            {feature.highlights.map((highlight, i) => (
              <motion.div
                key={highlight}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              >
                <CheckCircle2 className={`w-4 h-4 text-green-500/70 flex-shrink-0`} />
                <span className="text-sm text-muted-foreground">{highlight}</span>
              </motion.div>
            ))}
          </div>

          {/* Animated processing bar */}
          <motion.div
            className="mt-6 p-3 rounded-lg bg-secondary/50"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium">Processing</span>
              <span className="text-xs text-accent font-semibold">98%</span>
            </div>
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className={`h-full bg-gradient-to-r ${feature.color}`}
                initial={{ width: "0%" }}
                whileInView={{ width: "98%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.5, delay: 0.8 }}
              />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};

export default function FeaturesSection() {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  return (
    <section id="features" className="py-16 sm:py-24 scroll-mt-20 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease }}
        >
          <motion.div
            className="inline-block mb-4"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-foreground">
              Advanced Research Tools
            </span>
          </motion.div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            Powerful features for <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">researchers</span>
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Everything you need to accelerate your research work. From paper analysis to experiment planning, we've got you covered.
          </p>
        </motion.div>

        {/* Features with alternating layout */}
        <div className="space-y-16 sm:space-y-24">
          {features.map((feature, index) => (
            <motion.div
              key={feature.id}
              className={`grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center ${
                index % 2 === 1 ? "md:grid-flow-col-dense" : ""
              }`}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease }}
            >
              {/* Text content */}
              <motion.div
                className={`${index % 2 === 1 ? "md:col-span-1 md:order-2" : ""}`}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br ${feature.color} p-2`}
                    >
                      <feature.icon className="w-6 h-6 text-white" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-semibold text-foreground">
                      {feature.title}
                    </h3>
                  </div>

                  <p className="text-base text-muted-foreground leading-relaxed">
                    {feature.desc}
                  </p>

                  {/* Feature points */}
                  <div className="pt-4 space-y-2">
                    {feature.highlights.map((highlight) => (
                      <motion.div
                        key={highlight}
                        className="flex items-center gap-3 text-sm"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4 }}
                      >
                        <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-muted-foreground">{highlight}</span>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA button hover effect */}
                  <Link to="/signup" className="inline-block">
                    <motion.button
                      className={`mt-6 px-6 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                        hoveredFeature === index
                          ? "bg-accent text-accent-foreground"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Learn more →
                    </motion.button>
                  </Link>
                </div>
              </motion.div>

              {/* Animated window card */}
              <motion.div
                className={`h-80 sm:h-96 ${index % 2 === 1 ? "md:order-1" : ""}`}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                {index === 0 ? (
                  <PaperAnalyzerWindow />
                ) : index === 1 ? (
                  <ProblemGeneratorWindow />
                ) : index === 2 ? (
                  <ExperimentPlannerWindow />
                ) : index === 3 ? (
                  <GapDetectionWindow />
                ) : index === 4 ? (
                  <DatasetBenchmarkWindow />
                ) : (
                  <AnimatedWindowCard feature={feature} index={index} />
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mt-20 text-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <p className="text-muted-foreground mb-6">
            Start transforming your research workflow today
          </p>
          <Link to="/signup">
            <motion.button
              className="px-8 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started Free →
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
