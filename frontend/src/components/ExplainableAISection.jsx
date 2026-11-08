import { useState } from 'react'
import {
  Brain,
  Layers,
  Eye,
  Activity,
  Cpu,
  ShieldCheck,
  BookOpen,
} from 'lucide-react'

export default function ExplainableAISection({ isEmbedded = false }) {
  const [activeTab, setActiveTab] = useState('gradcam')

  const tabs = [
    { id: 'cnn', label: '1. What is a CNN?', icon: Layers },
    { id: 'mobilenet', label: '2. MobileNetV2', icon: Cpu },
    { id: 'transfer', label: '3. Transfer Learning', icon: Brain },
    { id: 'gradcam', label: '4. Grad-CAM Algorithm', icon: Eye },
    { id: 'why-xai', label: '5. Why XAI in Healthcare?', icon: ShieldCheck },
    { id: 'workflow', label: '6. End-to-End Workflow', icon: Activity },
  ]

  return (
    <div className={`transition-colors ${isEmbedded ? 'py-16 sm:py-20' : 'py-10 px-4 sm:px-6 lg:px-8 min-h-screen bg-gray-50 dark:bg-gray-950'}`}>
      <div className="max-w-6xl mx-auto space-y-10 px-4 sm:px-6 lg:px-8">
        
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            Interactive Educational Center
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Understanding Explainable AI (XAI)
          </h2>
          <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed">
            Demystifying Convolutional Neural Networks, MobileNetV2 Transfer Learning, and Gradient-weighted Class Activation Mapping in Medical Radiography.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content Cards */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-10 shadow-sm border border-gray-200 dark:border-gray-800">
          
          {/* TAB 1: CNN */}
          {activeTab === 'cnn' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <Layers className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    What is a Convolutional Neural Network (CNN)?
                  </h3>
                  <p className="text-sm text-gray-500">Spatial feature extraction through learnable convolution filters</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base">1. Convolutions & Kernels</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Unlike standard dense layers that flatten pixels into 1D vectors, 2D convolution kernels slide across the chest X-ray image to detect local spatial relationships: edges, bone density, soft tissue contrast, and opacities.
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base">2. Receptive Fields</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Early layers capture low-level features (rib outlines, clavicle borders). Deeper layers aggregate these into high-level medical abstractions: diffuse consolidations, reticular infiltrates, and pleural effusions.
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800">
                  <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-base">3. Translation Invariance</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Pooling layers downsample spatial feature maps, allowing the network to identify pneumonia-related infiltrates regardless of whether they appear in the right lower lobe, left upper lobe, or retrocardiac space.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MobileNetV2 */}
          {activeTab === 'mobilenet' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-2xl">
                  <Cpu className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Why MobileNetV2 for Pneumonia Detection?
                  </h3>
                  <p className="text-sm text-gray-500">High efficiency, minimal parameter count, and superior gradient propagation</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                  <h4 className="font-bold text-purple-600 dark:text-purple-400 text-sm uppercase tracking-wide">
                    Depthwise Separable Convolutions
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    MobileNetV2 factors standard 2D convolutions into two distinct operations:
                    a single <strong>depthwise</strong> filter per input channel, followed by a 1×1 <strong>pointwise</strong> convolution to blend channels. This reduces computation by ~8× to 9× with negligible loss in feature quality.
                  </p>
                </div>

                <div className="p-5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                  <h4 className="font-bold text-purple-600 dark:text-purple-400 text-sm uppercase tracking-wide">
                    Inverted Residual Bottlenecks
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Traditional ResNets compress high dimensions into bottlenecks. In contrast, MobileNetV2 connects thin bottleneck layers via skip connections, while expanding features into high dimensions internally, preserving subtle radiologic details without gradient vanishing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Transfer Learning */}
          {activeTab === 'transfer' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                  <Brain className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Transfer Learning in Medical Imaging
                  </h3>
                  <p className="text-sm text-gray-500">Overcoming small clinical dataset limits with ImageNet pretrained weights</p>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                Training deep neural networks from scratch typically demands hundreds of thousands of chest X-rays. With Transfer Learning:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">PHASE 1: FEATURE EXTRACTION</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    The 17 MobileNetV2 base bottleneck blocks are initialized with 14M+ ImageNet images and frozen. Only the new classification head is trained.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">PHASE 2: FINE-TUNING</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    The top 30 layers of MobileNetV2 are unfrozen with a reduced learning rate (1e-4) to calibrate convolutional filters to chest radiographic opacities.
                  </p>
                </div>

                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">BENEFITS</div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Rapid convergence, prevention of catastrophic overfitting, and enhanced generalization across varied radiographic exposure levels.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Grad-CAM Algorithm */}
          {activeTab === 'gradcam' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <Eye className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Gradient-Weighted Class Activation Mapping (Grad-CAM)
                  </h3>
                  <p className="text-sm text-gray-500">Translating gradients into visual heatmaps without model retraining</p>
                </div>
              </div>

              {/* Mathematical Workflow Steps */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">Forward Inference</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Image is passed through the network to generate the target class score <code className="text-blue-500 font-mono">y<sup>c</sup></code>.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">Compute Gradients</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Backpropagation calculates the gradient of score <code className="text-blue-500 font-mono">y<sup>c</sup></code> with respect to feature maps <code className="text-blue-500 font-mono">A<sup>k</sup></code> of layer <code className="text-blue-500 font-mono">Conv_1</code>.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">Global Pooling</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Gradients are spatially averaged across width and height to yield channel importance weights <code className="text-blue-500 font-mono">α<sub>k</sub><sup>c</sup></code>.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center mb-2">
                    4
                  </div>
                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-1">ReLU & Overlay</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Weighted linear combination is rectified with ReLU to isolate positive evidence, then upsampled and colormapped using JET colormap.
                  </p>
                </div>
              </div>

              {/* Formula box */}
              <div className="p-4 bg-gray-900 text-emerald-400 rounded-2xl font-mono text-xs sm:text-sm text-center">
                L<sub>Grad-CAM</sub><sup>c</sup> = ReLU( ∑<sub>k</sub> α<sub>k</sub><sup>c</sup> · A<sup>k</sup> )
              </div>
            </div>
          )}

          {/* TAB 5: Why XAI */}
          {activeTab === 'why-xai' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 rounded-2xl">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Why Explainable AI in Medicine?
                  </h3>
                  <p className="text-sm text-gray-500">Overcoming the "black box" dilemma in clinical decision support</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 rounded-2xl space-y-2">
                  <h4 className="font-bold text-red-800 dark:text-red-300 text-sm">
                    The Danger of Shortcut Learning
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    Unexplainable deep learning models can easily learn spurious artifacts: hospital radiographic tokens, patient positioning markers, or radiograph contrast variations rather than genuine lung parenchymal pathology.
                  </p>
                </div>

                <div className="p-5 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl space-y-2">
                  <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                    Clinical Verification & Trust
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    By overlaying gradient heatmaps directly onto the radiograph, clinicians can instantly verify whether the model is focusing on legitimate bilateral consolidations or an irrelevant extraneous edge.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Workflow */}
          {activeTab === 'workflow' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                  <Activity className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                    End-to-End System Workflow
                  </h3>
                  <p className="text-sm text-gray-500">From uploaded radiograph to Explainable AI report</p>
                </div>
              </div>

              <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-500 space-y-6">
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">1. Radiograph Upload & Validation</div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    User uploads DICOM/JPG/PNG; verified for 224×224 resolution and normalization to [-1, 1].
                  </p>
                </div>

                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">2. MobileNetV2 Deep Feature Extraction</div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    17 inverted bottleneck blocks process local spatial receptive fields, producing 1280 feature maps at layer Conv_1.
                  </p>
                </div>

                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">3. Global Average Pooling & Sigmoid Classification</div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Dense sigmoid neuron computes posterior class probabilities (NORMAL vs PNEUMONIA).
                  </p>
                </div>

                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">4. Grad-CAM Backpropagation & JET Heatmap</div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Gradients weight Conv_1 channels; ReLU removes negative activations; OpenCV generates α=0.4 anatomical overlay.
                  </p>
                </div>

                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">5. Interactive UI Display & PDF Report</div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Results presented with slider comparisons, clinical reasoning summaries, and downloadable PDF reports.
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  )
}

