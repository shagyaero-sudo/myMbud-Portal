import { supabase } from './supabase';
import { MaterialFile } from '../types';

const MATERIALS_TABLE = 'materials';

export const fetchMaterials = async (): Promise<MaterialFile[]> => {
  try {
    const { data, error } = await supabase
      .from(MATERIALS_TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((item) => ({
      id: item.id,
      courseId: item.course_id || '',
      courseName: item.course_name || '',
      session: item.session || '',
      title: item.title || '',
      fileUrl: item.file_url || '',
      fileType: item.file_type || 'pdf',
      fileSize: item.file_size || '3.0 MB',
      uploadDate: item.upload_date || new Date().toISOString(),
      uploader: item.uploader || 'Pengurus Kelas A',
      description: item.description || '',
    }));
  } catch (error) {
    console.error('Error fetching materials:', error);
    return [];
  }
};

export const addMaterialToFirestore = async (
  material: Omit<MaterialFile, 'id' | 'uploadDate'>
) => {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const { error } = await supabase.from(MATERIALS_TABLE).insert({
    id,
    course_id: material.courseId,
    course_name: material.courseName,
    session: material.session,
    title: material.title,
    file_url: material.fileUrl,
    file_type: material.fileType || 'pdf',
    file_size: material.fileSize || '3.0 MB',
    uploader: material.uploader || 'Pengurus Kelas A',
    description: material.description || '',
    upload_date: now,
    created_at: now,
  });

  if (error) throw error;
  return id;
};

export const deleteMaterialFromFirestore = async (id: string) => {
  const { error } = await supabase.from(MATERIALS_TABLE).delete().eq('id', id);
  if (error) throw error;
};