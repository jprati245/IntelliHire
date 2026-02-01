import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import * as pdfjs from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Set up PDF.js worker using bundled worker
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface ResumeUploadProps {
  onUploadComplete: () => void;
}

export function ResumeUpload({ onUploadComplete }: ResumeUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const extractTextFromPdf = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText.trim();
  };

  const uploadAndAnalyze = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      // Extract text from PDF
      const extractedText = await extractTextFromPdf(selectedFile);

      if (!extractedText || extractedText.length < 50) {
        throw new Error('Could not extract text from PDF. Please ensure the PDF contains readable text.');
      }

      // Upload to storage
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName);

      // Create analysis record
      const { data: analysisRecord, error: insertError } = await supabase
        .from('resume_analyses')
        .insert({
          user_id: user.id,
          file_url: urlData.publicUrl,
          file_name: selectedFile.name,
          analysis_status: 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call analyze function
      const { data: analyzeData, error: analyzeError } = await supabase.functions.invoke(
        'analyze-resume',
        {
          body: {
            analysisId: analysisRecord.id,
            extractedText,
          },
        }
      );

      if (analyzeError) {
        // Update status to failed
        await supabase
          .from('resume_analyses')
          .update({ analysis_status: 'failed' })
          .eq('id', analysisRecord.id);
        throw analyzeError;
      }

      toast({
        title: 'Resume Analyzed',
        description: 'Your resume has been successfully analyzed.',
      });

      setSelectedFile(null);
      onUploadComplete();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to analyze resume. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      toast({
        title: 'Invalid File',
        description: 'Please upload a PDF file.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        {!selectedFile ? (
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg p-8 text-center transition-colors ${
              isDragActive ? 'bg-primary/5' : 'hover:bg-muted/50'
            }`}
          >
            <input {...getInputProps()} />
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Upload className="h-7 w-7 text-primary" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              {isDragActive ? 'Drop your resume here' : 'Upload Your Resume'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop your PDF resume, or click to browse
            </p>
            <p className="mt-2 text-xs text-muted-foreground">PDF files only, max 10MB</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-foreground">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Button
              className="w-full"
              onClick={uploadAndAnalyze}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing Resume...
                </>
              ) : (
                'Analyze Resume'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
