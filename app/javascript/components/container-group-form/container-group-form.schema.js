import { componentTypes, validatorTypes } from '@@ddf';

// Load container managers
const providerUrl = '/api/providers?expand=resources&attributes=id,name,type&filter[]=type=ManageIQ::Providers::Openshift::ContainerManager';

const loadProviders = () =>
  API.get(providerUrl)
    .then(({ resources }) => resources.map(({ id, name }) => ({ label: name, value: id })))
    .catch((error) => {
      console.error('Error loading providers:', error);
      return [];
    });

// Load container projects for selected provider
const loadProjects = (emsId) => {
  if (!emsId) return Promise.resolve([]);

  const projectUrl = `/api/container_projects?expand=resources&attributes=id,name&filter[]=ems_id=${emsId}`;
  return API.get(projectUrl)
    .then(({ resources }) => resources.map(({ id, name }) => ({ label: name, value: id })))
    .catch((error) => {
      console.error('Error loading projects:', error);
      return [];
    });
};

// Default pod YAML template
const defaultPodYaml = `apiVersion: v1
kind: Pod
metadata:
  name: my-pod
  labels:
    app: myapp
spec:
  containers:
  - name: my-container
    image: nginx:latest
    ports:
    - containerPort: 80
    resources:
      requests:
        memory: "64Mi"
        cpu: "250m"
      limits:
        memory: "128Mi"
        cpu: "500m"`;

const createSchema = (emsId, setState, mode = 'create') => {
  if (mode === 'edit') {
    return {
      fields: [
        // Read-only pod information
        {
          component: componentTypes.TEXT_FIELD,
          id: 'pod_name',
          name: 'pod_name',
          label: __('Pod Name'),
	  isDisabled: true,
        },
        {
          component: componentTypes.TEXT_FIELD,
          id: 'namespace',
          name: 'namespace',
          label: __('Namespace'),
	  isDisabled: true,
        },
        {
          component: componentTypes.TEXT_FIELD,
          id: 'container_provider',
          name: 'container_provider',
          label: __('Container Provider'),
	  isDisabled: true,
        },
        // Labels section
        {
          component: componentTypes.SUB_FORM,
          id: 'labels_section',
          name: 'labels_section',
          title: __('Labels'),
          fields: [
            {
              component: componentTypes.FIELD_ARRAY,
              id: 'labels',
              name: 'labels',
              fields: [
                {
                  component: componentTypes.TEXT_FIELD,
                  id: 'key',
                  name: 'key',
                  label: __('Key'),
                  validate: [
                    { type: validatorTypes.REQUIRED },
                    { 
                      type: validatorTypes.PATTERN,
                      pattern: /^[a-zA-Z0-9]([-._a-zA-Z0-9]*[a-zA-Z0-9])?$/,
                      message: __('Invalid label key format')
                    }
                  ],
                  isRequired: true,
                },
                {
                  component: componentTypes.TEXT_FIELD,
                  id: 'value',
                  name: 'value',
                  label: __('Value'),
                  validate: [
                    { 
                      type: validatorTypes.PATTERN,
                      pattern: /^[a-zA-Z0-9]([-._a-zA-Z0-9]*[a-zA-Z0-9])?$/,
                      message: __('Invalid label value format')
                    }
                  ],
                },
              ],
              buttonLabels: {
                add: __('Add Label'),
                remove: __('Remove'),
              },
            },
          ],
        },
        // Annotations section
        {
          component: componentTypes.SUB_FORM,
          id: 'annotations_section',
          name: 'annotations_section',
          title: __('Annotations'),
          fields: [
            {
              component: componentTypes.FIELD_ARRAY,
              id: 'annotations',
              name: 'annotations',
              fields: [
                {
                  component: componentTypes.TEXT_FIELD,
                  id: 'key',
                  name: 'key',
                  label: __('Key'),
                  validate: [{ type: validatorTypes.REQUIRED }],
                  isRequired: true,
                },
                {
                  component: componentTypes.TEXT_FIELD,
                  id: 'value',
                  name: 'value',
                  label: __('Value'),
                },
              ],
              buttonLabels: {
                add: __('Add Annotation'),
                remove: __('Remove'),
              },
            },
          ],
        },
      ],
    };
  }

  // Create mode - YAML based
  return {
    fields: [
      {
        component: componentTypes.SELECT,
        id: 'ems_id',
        name: 'ems_id',
        label: __('Container Provider'),
        validate: [{ type: validatorTypes.REQUIRED }],
        onChange: (value) => setState((state) => ({ ...state, emsId: value, container_project_id: null })),
        isRequired: true,
        includeEmpty: true,
        loadOptions: loadProviders,
      },
      {
        component: componentTypes.SELECT,
        id: 'container_project_id',
        name: 'container_project_id',
        label: __('Namespace / Project'),
        validate: [{ type: validatorTypes.REQUIRED }],
        isRequired: true,
        isDisabled: !emsId,
        includeEmpty: true,
        loadOptions: () => loadProjects(emsId),
        key: emsId, // Force reload when provider changes
        condition: {
          when: 'ems_id',
          isNotEmpty: true,
        },
      },
      {
        component: componentTypes.TEXTAREA,
        id: 'yaml_content',
        name: 'yaml_content',
        label: __('Pod Definition (YAML)'),
        validate: [
          { type: validatorTypes.REQUIRED },
          {
            type: validatorTypes.PATTERN,
            pattern: /^apiVersion:/,
            message: __('YAML must start with apiVersion'),
          },
        ],
        isRequired: true,
        rows: 20,
        className: 'yaml-editor',
        initialValue: defaultPodYaml,
        helperText: __('Define your pod using YAML format'),
      },
    ],
  };
};

export default createSchema;
