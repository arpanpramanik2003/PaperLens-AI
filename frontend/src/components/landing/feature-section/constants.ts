import { Brain, FileText, FlaskConical, Lightbulb, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Feature = {
  id: number;
  icon: LucideIcon;
  title: string;
  desc: string;
  highlights: string[];
  color: string;
};

export const features: Feature[] = [
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

export const randomProjects = [
  { name: "Deep Learning for Medical Imaging", summary: "Novel CNN architecture for early disease detection", problem: "Improve diagnostic accuracy in X-ray analysis", methodology: "Transfer learning with ResNet-50 backbone" },
  { name: "Natural Language Processing for Code", summary: "AI model understanding programming patterns", problem: "Automate code review and optimization", methodology: "Transformer-based sequence-to-sequence learning" },
  { name: "Quantum Computing Applications", summary: "Quantum algorithms for optimization problems", problem: "Reduce computational complexity of NP-hard problems", methodology: "Variational quantum eigensolver implementation" },
  { name: "EdgeAI for IoT Devices", summary: "Lightweight models for embedded systems", problem: "Deploy AI on resource-constrained hardware", methodology: "Model quantization and pruning techniques" },
  { name: "Blockchain Security Analysis", summary: "Vulnerability detection in smart contracts", problem: "Identify and prevent contract exploits", methodology: "Static analysis with machine learning" },
];

export const randomQuestions = [
  { q: "What's the main contribution of this paper?", a: "This work proposes a novel approach to tackle scalability issues while maintaining state-of-the-art accuracy." },
  { q: "How does this compare to existing solutions?", a: "The proposed method achieves 23% faster processing with 15% higher accuracy compared to baseline approaches." },
  { q: "What datasets were used in experiments?", a: "The study uses publicly available datasets including CIFAR-10, ImageNet, and custom annotated data." },
  { q: "What are the limitations mentioned?", a: "Current approach requires GPU acceleration and struggles with real-time inference on edge devices." },
  { q: "What's the future direction?", a: "Next steps involve model optimization for mobile deployment and exploring federated learning approaches." },
];

export const domains = ["Deep Learning", "Natural Language Processing", "Computer Vision", "Reinforcement Learning", "Graph Neural Networks"];

export const subdomains = {
  "Deep Learning": ["Medical Imaging", "Audio Processing", "Time Series", "3D Vision"],
  "Natural Language Processing": ["Machine Translation", "Question Answering", "Sentiment Analysis", "Text Summarization"],
  "Computer Vision": ["Object Detection", "Segmentation", "Face Recognition", "Scene Understanding"],
  "Reinforcement Learning": ["Game AI", "Robotics", "Autonomous Driving", "Resource Allocation"],
  "Graph Neural Networks": ["Social Networks", "Molecule Prediction", "Knowledge Graphs", "Recommendation Systems"],
};

export const researchIdeas = [
  { title: "Adversarial Robustness in Neural Networks", desc: "Develop an AI framework utilizing adversarial training to generate synthetic data. Framework should be integrated with deep learning models.", tags: ["AdversarialNets", "DeepLearning", "MedicalImaging", "Personalization"], rating: 5 },
  { title: "Explainable Radiomics Detection", desc: "Create a deep learning-based radiomics platform with human-interpretable explanations. Featured with attention mechanisms for key region highlighting.", tags: ["Radiomics", "MedicalImaging", "Explainability", "AttentionMechanisms"], rating: 4 },
  { title: "Multi-Modal Fusion for Disease Prediction", desc: "Integrate multiple medical imaging modalities with clinical data using transformer architectures for improved diagnosis accuracy.", tags: ["MultiModal", "Fusion", "Transformers", "ClinicalAI"], rating: 5 },
  { title: "Real-time Anomaly Detection System", desc: "Build an edge-deployed anomaly detection system using quantized neural networks for resource-constrained medical devices.", tags: ["EdgeComputing", "Quantization", "RealTime", "Anomaly"], rating: 4 },
  { title: "Self-Supervised Learning for Medical Data", desc: "Develop self-supervised learning techniques to leverage unlabeled medical imaging data for pre-training robust encoders.", tags: ["SelfSupervised", "Medical", "Pretraining", "Unsupervised"], rating: 5 },
];

export const researchTopics = ["Brain Tumor", "Cardiac Imaging", "Alzheimer's Detection", "Lung Cancer", "Diabetic Retinopathy"];
export const difficultyLevels = ["Beginner", "Intermediate", "Advanced", "Expert"];

export const experimentSteps = [
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

export const projectTitles = ["Brain Tumor", "Alzheimer's Detection", "COVID-19 Detection", "Diabetic Retinopathy", "Cancer Classification"];

export const datasetsData = [
  { name: "Brain Tumor Segmentation (BraTS)", rating: 4.5, desc: "Contains 3D MRI scans for brain tumor segmentation", tags: ["Tumor segmentation", "Volume estimation"] },
  { name: "TCGA - Brain Tumors Segmentation", rating: 4.5, desc: "Radiosurgery DICOM and MRI scans with segmentation labels", tags: ["Radiosurgery extraction", "Tumor volume estimation"] },
  { name: "Cancer Genome Atlas (TCGA) - Brain", rating: 4.5, desc: "Genomic data, clinical data, and histology data of brain tumors", tags: ["Genomic analysis", "Tumor subtype classification"] },
  { name: "Harvard's Brain Tumor Dataset", rating: 4.3, desc: "Contains 3D MRI scans with segmentation labels and clinical data", tags: ["Tumor segmentation", "Volume estimation"] },
  { name: "Brain Tumor Segmentation Challenge 2019", rating: 4.0, desc: "Contains 3D MRI scans for brain tumor segmentation evaluation", tags: ["Tumor segmentation evaluation"] },
  { name: "MRIBrainS Challenge", rating: 4.0, desc: "Contains 3D MRI scans for brain tumor segmentation evaluation", tags: ["Tumor segmentation evaluation"] },
];

export const benchmarksData = [
  { name: "Dice Similarity Coefficient (DSC)", rating: 4.5, desc: "Evaluates overlap between predicted and actual tumor masks", tags: [] },
  { name: "Hausdorff Distance", rating: 4.5, desc: "Evaluates the distance between predicted and actual tumor contours", tags: [] },
  { name: "Volume-based benchmark", rating: 4.3, desc: "Evaluates the accuracy of predicted tumor volume", tags: [] },
];

export const domainDescriptions = [
  "Medical image analysis for diagnosis and treatment of brain tumors.",
  "Deep learning models for automated lesion detection in CT scans.",
  "AI-powered pathology image analysis for cancer screening.",
];

export const projectDescriptions = [
  "Design and development of a medical decision support system using deep reinforcement learning algorithms to generate adversarial examples, while integrating attention-based explainability methods for improved model interpretability. Our proposed approach would allow clinicians to understand the model's decision-making process, thereby enhancing trust and confidence in the system's recommendations.",
  "Development of an AI framework for autonomous vehicle navigation using multi-modal sensor fusion. The system integrates LiDAR, camera, and radar data through a transformer-based architecture with real-time decision making capabilities.",
  "Creation of a personalized cancer treatment recommendation engine using graph neural networks and federated learning to preserve patient privacy while improving treatment outcomes across distributed healthcare systems.",
];

export const detectedGaps = [
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
