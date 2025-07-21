import React, { useState, useEffect } from 'react';
import { Grid } from 'carbon-components-react';
import MiqFormRenderer from '@@ddf';
import miqRedirectBack from '../../helpers/miq-redirect-back';
import createSchema from './container-group-form.schema';

const ContainerPodForm = ({ recordId, mode = 'create' }) => {
  const [{ emsId, container_project_id }, setState] = useState({
    emsId: null,
    container_project_id: null
  });
  const [initialValues, setInitialValues] = useState({});
  const [loading, setLoading] = useState(false);

  // Helper function to convert object to field array format
  const objectToFieldArray = (obj) => {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([key, value]) => ({ key, value }));
  };

  // Helper function to convert field array to object format
  const fieldArrayToObject = (array) => {
    if (!Array.isArray(array)) return {};
    const result = {};
    array.forEach(({ key, value }) => {
      if (key && key.trim()) {
        result[key] = value || '';
      }
    });
    return result;
  };

  useEffect(() => {
    if (mode === 'edit' && recordId) {
      setLoading(true);
      miqSparkleOn();

      // Get pod metadata for edit mode
      API.post(`/api/container_groups/${recordId}`, {
        action: 'get_metadata'
      })
        .then((response) => {
          const pod = response;
          const labels = pod.labels || {};
          const annotations = pod.annotations || {};
          const containerProject = pod.container_project || {};
          const extManagementSystem = pod.ext_management_system || {};

          setInitialValues({
            pod_name: pod.name,
            namespace: containerProject.name || 'Unknown',
            container_provider: extManagementSystem.name || 'Unknown',
            labels: objectToFieldArray(labels),
            annotations: objectToFieldArray(annotations),
          });

          setState({
            emsId: extManagementSystem.id,
            container_project_id: containerProject.id
          });
        })
        .catch((error) => {
          console.error('Error loading pod data:', error);
          let errorMessage = __('Failed to load pod data');
          if (error && error.data && error.data.error && error.data.error.message) {
            errorMessage = error.data.error.message;
          }
          miqRedirectBack(errorMessage, 'error', '/container_group/show_list');
        })
        .finally(() => {
          setLoading(false);
          miqSparkleOff();
        });
    }
  }, [mode, recordId]);

  const onSubmit = (values) => {
    miqSparkleOn();

    let request;
    if (mode === 'create') {
      // Create new pod using YAML
      request = API.post('/api/container_groups', {
        action: 'create',
        resource: {
          ems_id: values.ems_id,
          container_project_id: values.container_project_id,
          yaml_content: values.yaml_content
        }
      });
    } else {
      // Update existing pod using structured data
      const labels = fieldArrayToObject(values.labels || []);
      const annotations = fieldArrayToObject(values.annotations || []);

      request = API.post(`/api/container_groups/${recordId}`, {
        action: 'edit',
        resource: {
          labels: labels,
          annotations: annotations
        }
      });
    }

    request.then((response) => {
      const message = mode === 'create'
        ? __('Creation of Pod has been successfully queued.')
        : __('Update of Pod has been successfully queued.');
      const redirectUrl = mode === 'create'
        ? '/container_group/show_list'
        : `/container_group/show/${recordId}`;
      miqRedirectBack(message, 'success', redirectUrl);
    }).catch((error) => {
      miqSparkleOff();
      console.error('Error submitting form:', error);

      // Handle error message extraction
      let errorMessage = __('An error occurred');
      if (error && error.data) {
        if (error.data.error && error.data.error.message) {
          errorMessage = error.data.error.message;
        } else if (typeof error.data.error === 'string') {
          errorMessage = error.data.error;
        } else if (typeof error.data === 'string') {
          errorMessage = error.data;
        }
      }

      miqFlashLater({ message: errorMessage, level: 'error' });
    });
  };

  const onCancel = () => {
    const message = mode === 'create'
      ? __('Creation of new Pod was canceled by the user.')
      : __('Edit of Pod was canceled by the user.');
    const redirectUrl = mode === 'create'
      ? '/container_group/show_list'
      : `/container_group/show/${recordId}`;
    miqRedirectBack(message, 'warning', redirectUrl);
  };

  return (
    <Grid>
      <MiqFormRenderer
        initialValues={initialValues}
        schema={createSchema(emsId, setState, mode)}
        onSubmit={onSubmit}
        onCancel={onCancel}
        buttonsLabels={{
          submitLabel: mode === 'create' ? __('Create') : __('Save'),
          cancelLabel: __('Cancel')
        }}
      />
    </Grid>
  );
};

export default ContainerPodForm;
