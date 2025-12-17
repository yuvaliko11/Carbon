import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Divider,
  TextField,
  Avatar,
  Drawer,
  Chip,
  Grid,
  CircularProgress,
  Tooltip,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Tabs,
  Tab
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Send as SendIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PictureAsPdfIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Close as CloseIcon,
  SmartToy as SmartToyIcon,
  AttachFile as AttachFileIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Sort as SortIcon,
  Download as DownloadIcon,
  ArrowBack as ArrowBackIcon
} from '@mui/icons-material';
import ManualContractEntry from '../components/Contracts/ManualContractEntry';
import ThinkingAnimation from '../components/ThinkingAnimation';
import ContractDetailView from '../components/Contracts/ContractDetailView';
import { carbonContractsAPI, clearCache } from '../services/api';
import logger from '../utils/logger';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import ConfirmDialog from '../components/ConfirmDialog';

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// --- Helper Components ---

const FileIcon = ({ fileName }) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <PictureAsPdfIcon sx={{ color: '#d32f2f' }} />;
  if (['doc', 'docx'].includes(ext)) return <DescriptionIcon sx={{ color: '#1976d2' }} />;
  return <InsertDriveFileIcon sx={{ color: '#757575' }} />;
};

const StatusChip = ({ status }) => {
  let color = 'default';
  let icon = null;

  switch (status) {
    case 'compliant':
      color = 'success';
      icon = <CheckCircleIcon fontSize="small" />;
      break;
    case 'warning':
      color = 'warning';
      icon = <WarningIcon fontSize="small" />;
      break;
    case 'breach':
      color = 'error';
      icon = <ErrorIcon fontSize="small" />;
      break;
    default:
      color = 'default';
  }

  return (
    <Chip
      icon={icon}
      label={status}
      color={color}
      size="small"
      variant="outlined"
      sx={{ textTransform: 'capitalize', fontWeight: 600 }}
    />
  );
};

// --- Main Component ---

const ContractIngest = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();

  // Data State
  // data state
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // newest, oldest, name, score
  const [rightPanelTab, setRightPanelTab] = useState(0);

  // Menu State
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuContractId, setMenuContractId] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Chat State
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm your AI Contract Assistant. You can upload contracts here, and I'll extract the key details for you. How can I help?", sender: 'ai', timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Upload State
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadFlowState, setUploadFlowState] = useState('idle'); // idle, waiting_for_xy
  const [pendingFiles, setPendingFiles] = useState([]);

  // Load Contracts
  useEffect(() => {
    loadContracts();
  }, []);

  // Filter and Sort Contracts
  useEffect(() => {
    let result = [...contracts];

    // Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(query) ||
        (c.mataqaliName && c.mataqaliName.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortOrder) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'score':
        result.sort((a, b) => (b.greenScore || 0) - (a.greenScore || 0));
        break;
      default:
        break;
    }

    setFilteredContracts(result);
  }, [contracts, searchQuery, sortOrder]);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadContracts = async () => {
    try {
      setLoading(true);
      const response = await carbonContractsAPI.getAll();
      if (response.data && response.data.success) {
        setContracts(response.data.data || []);
      }
    } catch (err) {
      logger.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

  const handleMenuOpen = (event, contractId) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setMenuContractId(contractId);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuContractId(null);
  };

  const handleDeleteClick = () => {
    console.log('DEBUG: handleDeleteClick triggered');
    if (!menuContractId) return;
    setDeleteTargetId(menuContractId);
    handleMenuClose();
    // Small delay to allow menu to close properly before opening dialog
    setTimeout(() => {
      console.log('DEBUG: Opening ConfirmDialog');
      setDeleteConfirmOpen(true);
    }, 100);
  };

  const handleConfirmDelete = async () => {
    setDeleteConfirmOpen(false);
    if (!deleteTargetId) return;

    try {
      await carbonContractsAPI.delete(deleteTargetId);
      setContracts(prev => prev.filter(c => c._id !== deleteTargetId));
      if (selectedContract?._id === deleteTargetId) setSelectedContract(null);
    } catch (err) {
      logger.error('Error deleting contract:', err);
    } finally {
      setDeleteTargetId(null);
    }
  };

  const handleViewDetails = () => {
    const contract = contracts.find(c => c._id === menuContractId);
    if (contract) setSelectedContract(contract);
    handleMenuClose();
  };

  // --- Chat Handlers ---

  const processUpload = async (filesToUpload) => {
    setUploading(true);
    setUploadFlowState('idle');
    setPendingFiles([]);

    const uploadMsgId = Date.now();
    setMessages(prev => [...prev, {
      id: uploadMsgId,
      text: `Uploading ${filesToUpload.length} file(s)...`,
      sender: 'user',
      isSystem: true,
      timestamp: new Date()
    }]);

    try {
      const formData = new FormData();
      Array.from(filesToUpload).forEach(file => formData.append('contracts', file));

      const response = await carbonContractsAPI.upload(formData);

      if (response.data && response.data.success) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: `✅ Successfully uploaded and analyzed ${response.data.count} contract(s).`,
          sender: 'ai',
          timestamp: new Date()
        }]);
        await loadContracts();
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload Error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Upload failed';
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: `❌ Upload failed: ${errorMessage}`,
        sender: 'ai',
        timestamp: new Date()
      }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // INTERCEPT: Waiting for X/Y answer
    if (uploadFlowState === 'waiting_for_xy') {
      const text = inputMessage.toLowerCase();
      // If user says No (or variants)
      if (text.includes('no') || text.includes('cancel') || text.includes('skip') || text.includes('proceed')) {
        const userMsg = { id: Date.now(), text: inputMessage, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');

        // Add AI confirmation
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: "Understood. Proceeding with contract analysis only.",
          sender: 'ai',
          timestamp: new Date()
        }]);

        // Trigger upload
        await processUpload(pendingFiles);
        return;
      }
      // If user says Yes but didn't upload
      else if (text.includes('yes') || text.includes('sure') || text.includes('have')) {
        const userMsg = { id: Date.now(), text: inputMessage, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputMessage('');
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: "Great! Please click the attachment icon to upload the CSV/TXT file now.",
          sender: 'ai',
          timestamp: new Date()
        }]);
        return;
      }
    }

    // Normal Chat Flow
    const newUserMsg = { id: Date.now(), text: inputMessage, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, newUserMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      // Build context from selected contract if available
      let context = '';
      if (selectedContract) {
        context = `
          Current Contract in View:
          Name: ${selectedContract.name}
          Lease Number: ${selectedContract.leaseNumber || 'N/A'}
          Term: ${selectedContract.termYears || 'N/A'} years
          Annual Rent: $${selectedContract.annualRent?.amount || 0}
          Green Score: ${selectedContract.greenScore || 'N/A'}
          Compliance Status: ${selectedContract.status || 'N/A'}
          Landowner Unit: ${selectedContract.mataqaliName || 'N/A'}
        `;
      } else {
        context = "No specific contract is currently selected by the user. Answer general questions about land leases and carbon eligibility.";
      }

      const response = await carbonContractsAPI.chat(newUserMsg.text, context);
      const aiResponseText = response.data.reply;

      const newAiMsg = { id: Date.now() + 1, text: aiResponseText, sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, newAiMsg]);
    } catch (err) {
      console.error('Chat Error:', err);
      const errorMsg = { id: Date.now() + 1, text: "I'm having trouble connecting to the server. Please try again.", sender: 'ai', timestamp: new Date() };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Check scenarios
    const hasPDF = files.some(f => f.name.toLowerCase().endsWith('.pdf'));
    const hasCSV = files.some(f => f.name.toLowerCase().endsWith('.csv') || f.name.toLowerCase().endsWith('.txt'));

    // 1. IF we are already waiting for X/Y and user uploads ANY file (presumably the CSV)
    if (uploadFlowState === 'waiting_for_xy') {
      const renamedFiles = files.map(f => {
        // If we have exactly one pending contract, we can force-rename the coords file to match it
        if (pendingFiles.length === 1) {
          const pendingName = pendingFiles[0].name;
          const pendingBase = pendingName.substring(0, pendingName.lastIndexOf('.')) || pendingName;
          const ext = f.name.split('.').pop().toLowerCase();

          let newName = f.name;
          if (ext === 'pdf') {
            // Special suffix for PDF coords so backend knows it's not a contract
            newName = `${pendingBase}.coords.pdf`;
          } else if (ext === 'csv' || ext === 'txt') {
            // Match basename for CSV/TXT
            newName = `${pendingBase}.${ext}`;
          }

          if (newName !== f.name) {
            console.log(`Renaming ${f.name} to ${newName} for pairing.`);
            return new File([f], newName, { type: f.type });
          }
        }
        return f;
      });

      const combinedFiles = [...pendingFiles, ...renamedFiles];
      const userMsg = { id: Date.now(), text: `Uploaded ${files.length} file(s) for pairing.`, sender: 'user', isSystem: true, timestamp: new Date() };
      setMessages(prev => [...prev, userMsg]);
      await processUpload(combinedFiles);
      return;
    }

    // 2. IF uploading PDF + CSV together -> Go straight to upload
    if (hasPDF && hasCSV) {
      await processUpload(files);
      return;
    }

    // 3. IF uploading PDF only -> Pause and Ask
    if (hasPDF && !hasCSV) {
      setPendingFiles(files);
      setUploadFlowState('waiting_for_xy');

      // Show file bubble
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: `Selected ${files.length} contract(s).`,
        sender: 'user',
        isSystem: true,
        timestamp: new Date()
      }]);

      // Ask Question
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: "I see you uploaded a contract. Do you have a corresponding X/Y coordinate file (CSV/TXT)? Upload it now, or type 'no' to proceed without it.",
          sender: 'ai',
          timestamp: new Date()
        }]);
      }, 500);
      return;
    }

    // 4. Fallback (e.g. just CSV, or other) -> Just upload
    await processUpload(files);
  };

  // --- Renderers ---

  return (
    <Box sx={{ display: 'flex', height: '100%', bgcolor: '#f5f5f5', overflow: 'hidden' }}>

      {/* Left Panel: AI Chat (35%) */}
      <Paper
        elevation={3}
        sx={{
          width: isMobile ? '100%' : '35%',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid #e0e0e0',
          zIndex: 2,
          position: 'relative'
        }}
      >
        {/* Chat Header */}
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate('/')} sx={{ color: 'white' }}>
            <ArrowBackIcon />
          </IconButton>
          <Avatar sx={{ bgcolor: 'white', color: 'primary.main' }}>
            <SmartToyIcon />
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">AI Contract Assistant</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Always here to help</Typography>
          </Box>
        </Box>

        {/* Chat Messages */}
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column', gap: 2, bgcolor: '#f8f9fa' }}>
          {messages.map((msg) => (
            <Box
              key={msg.id}
              sx={{
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              <Paper
                elevation={1}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: msg.isSystem ? '#e3f2fd' : (msg.sender === 'user' ? 'primary.light' : 'white'),
                  color: msg.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                  borderTopRightRadius: msg.sender === 'user' ? 0 : 2,
                  borderTopLeftRadius: msg.sender === 'ai' ? 0 : 2,
                }}
              >
                <Typography variant="body2">{msg.text}</Typography>
              </Paper>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, px: 0.5 }}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Box>
          ))}
          {(isTyping || uploading) && (
            <Box sx={{ alignSelf: 'flex-start' }}>
              <ThinkingAnimation mode={uploading ? 'upload' : 'chat'} />
            </Box>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Chat Input */}
        <Box sx={{ p: 2, bgcolor: 'white', borderTop: '1px solid #e0e0e0' }}>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <input
              type="file"
              multiple
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".pdf,.doc,.docx,.txt,.csv"
            />
            <IconButton
              color="primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <CircularProgress size={24} /> : <AttachFileIcon />}
            </IconButton>
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message or upload a file..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={uploading}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 4,
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || uploading}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Right Panel: Contract List or Manual Entry (65%) */}
      {!isMobile && (
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid #e0e0e0' }}>
          {/* Tabs for Right Panel */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={rightPanelTab} onChange={(e, v) => setRightPanelTab(v)} aria-label="upload tabs">
              <Tab label="Repository" />
              <Tab label="Manual Entry" />
            </Tabs>
          </Box>

          {rightPanelTab === 0 && (
            <>
              {selectedContract ? (
                <ContractDetailView
                  contract={selectedContract}
                  onBack={() => setSelectedContract(null)}
                />
              ) : (
                <>
                  {/* Toolbar */}
                  <Box sx={{ p: 2, bgcolor: 'white', borderBottom: '1px solid #e0e0e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" fontWeight="bold">Contracts Repository</Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        placeholder="Search contracts..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        InputProps={{ startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} /> }}
                        sx={{ width: 300 }}
                      />

                      {/* Sort Menu */}
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          displayEmpty
                          inputProps={{ 'aria-label': 'Sort' }}
                        >
                          <MenuItem value="newest">Newest</MenuItem>
                          <MenuItem value="oldest">Oldest</MenuItem>
                          <MenuItem value="name">Name</MenuItem>
                          <MenuItem value="score">Score</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>

                  {/* List */}
                  <Box sx={{ flexGrow: 1, overflowY: 'auto', bgcolor: 'white' }}>
                    {loading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                      </Box>
                    ) : filteredContracts.length === 0 ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'text.secondary' }}>
                        <CloudUploadIcon sx={{ fontSize: 64, mb: 2, opacity: 0.5 }} />
                        <Typography variant="h6">No contracts found</Typography>
                        <Typography variant="body2">Try adjusting your search or upload a new one</Typography>
                      </Box>
                    ) : (
                      <List sx={{ p: 0 }}>
                        {filteredContracts.map((contract) => (
                          <React.Fragment key={contract._id}>
                            <ListItem
                              button
                              onClick={() => setSelectedContract(contract)}
                              selected={selectedContract?._id === contract._id}
                              sx={{
                                py: 2,
                                borderBottom: '1px solid #f0f0f0',
                                '&:hover': { bgcolor: '#f5f5f5' },
                                '&.Mui-selected': { bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }
                              }}
                              secondaryAction={
                                <IconButton edge="end" onClick={(e) => handleMenuOpen(e, contract._id)}>
                                  <MoreVertIcon />
                                </IconButton>
                              }
                            >
                              <ListItemIcon>
                                <Avatar sx={{ bgcolor: 'transparent', border: '1px solid #e0e0e0' }}>
                                  <FileIcon fileName={contract.name || 'doc.pdf'} />
                                </Avatar>
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pr: 4 }}>
                                    <Typography variant="subtitle1" fontWeight="600">{contract.name}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {new Date(contract.createdAt).toLocaleDateString()}
                                    </Typography>
                                  </Box>
                                }
                                secondary={
                                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5, alignItems: 'center' }}>
                                    <StatusChip status={contract.status} />
                                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 300 }}>
                                      {contract.mataqaliName ? `Owner: ${contract.mataqaliName}` : 'No owner info'}
                                    </Typography>
                                  </Box>
                                }
                              />
                            </ListItem>
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </Box>
                </>
              )}
            </>
          )}

          {rightPanelTab === 1 && (
            <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 0 }}>
              <ManualContractEntry />
            </Box>
          )}
        </Box>
      )}

      {/* 3-Dots Menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleViewDetails}>
          <ListItemIcon><DescriptionIcon fontSize="small" /></ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          <ListItemText>Delete</ListItemText>
        </MenuItem>
      </Menu>



      <ConfirmDialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Contract"
        message="Are you sure you want to delete this contract? This action cannot be undone."
        confirmLabel="Delete"
        severity="error"
      />

    </Box>
  );
};

export default ContractIngest;
