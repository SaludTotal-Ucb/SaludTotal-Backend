# Proyecto Integrador Salud Total
**Nombre de la estudiante:** Maria Belen Becerra Rivera
**Semestre:** Séptimo Semestre
**Carrera:** Ingeniería de Software
**Asignatura:** Computación en la Nube (ISW-341)
**Docente:** Ing. Fabrizio Gustavo Bellido Parra
**Universidad:** Universidad Católica Boliviana, Sede Santa Cruz

---

## 1. Ficha Técnica del Proyecto Base

El proyecto **Salud Total** es un sistema integral de gestión médica diseñado mediante una arquitectura desacoplada y principios de Clean Architecture. 

*   **Capa Backend (API):** Desarrollada con **NestJS (Node.js v20)**, utilizando TypeScript para garantizar seguridad de tipado. La capa de persistencia se maneja a través de **Prisma ORM**, conectándose a una base de datos relacional PostgreSQL.
*   **Capa Frontend (Cliente):** Aplicación SPA desarrollada con **React** y construida con **Vite**, consumiendo los servicios RESTful expuestos por el Backend.
*   **Flujos CRUD Médicos:**
    *   **Gestión de Citas:** Permite la creación (Agendar), lectura (Obtener por médico/paciente) y cancelación de citas médicas.
    *   **Historial Clínico:** CRUD para registrar, visualizar y actualizar los diagnósticos y tratamientos (Historial Médico) de los pacientes de forma segura y estructurada.

---

## 2. Definición de Arquitectura de Red y Nube

La infraestructura está desplegada bajo la "Ruta A" (AWS Learner Lab), adaptada para operar con un presupuesto inferior a $50 USD y bajo las restricciones de políticas de IAM (`LabRole`). La capa de cómputo se ha implementado de forma autogestionada sobre una instancia EC2 utilizando **K3s** (una distribución ligera de Kubernetes).

### Diagrama de Arquitectura (ASCII)

```text
                                       [ GitHub Actions CI/CD ]
                                                | (Push Image & SSH Deploy)
                                                v
+-----------------------------------------------------------------------------------+
|  AWS Cloud - us-east-1 (Learner Lab)                                              |
|                                                                                   |
|  +-----------------------------------------------------------------------------+  |
|  | VPC (Virtual Private Cloud)                                                 |  |
|  |                                                                             |  |
|  |  [ Internet Gateway ]                                                       |  |
|  |         |                                                                   |  |
|  |         v                                                                   |  |
|  |  +-------------------------------------+    +----------------------------+  |  |
|  |  | Public Subnet                       |    | Private/Data Subnet        |  |  |
|  |  |                                     |    |                            |  |  |
|  |  |  +-------------------------------+  |    |  +----------------------+  |  |  |
|  |  |  | EC2 Instance (t3.medium)      |  |    |  | AWS RDS (PostgreSQL) |  |  |  |
|  |  |  | (K3s Cluster - Auto-hosted)   |  |    |  | (db.t3.micro)        |  |  |  |
|  |  |  |                               |  |    |  |                      |  |  |  |
|  |  |  |  +-------------------------+  |  |    |  |                      |  |  |  |
|  |  |  |  |   SaludTotal Backend    |--|--|----|->| [ Database Tables ]  |  |  |  |
|  |  |  |  |   (Pods / ReplicaSet 2) |  |  |    |  |                      |  |  |  |
|  |  |  |  +-------------------------+  |  |    |  +----------------------+  |  |  |
|  |  |  |  | Service: ClusterIP      |  |  |    |                            |  |  |
|  |  |  |  | Ingress/NodePort        |  |  |    +----------------------------+  |  |
|  |  |  +-------------------------------+  |                                    |  |
|  |  +-------------------------------------+                                    |  |
|  +-----------------------------------------------------------------------------+  |
+-----------------------------------------------------------------------------------+
       ^
       |
[ Tráfico HTTP/REST desde Frontend (React) ]
```

---

## 3. Registro de Decisiones de Arquitectura (ADR)

### ADR-001: Uso de K3s autohospedado en EC2 en lugar de Amazon EKS
*   **Contexto:** Se requiere un entorno de orquestación de contenedores en AWS para desplegar los microservicios del proyecto. AWS ofrece EKS como servicio gestionado, pero el entorno del proyecto es el AWS Learner Lab.
*   **Restricciones:** El Learner Lab impone políticas estrictas de IAM (`LabRole`), que en muchos casos bloquean la creación de los roles específicos (Service-Linked Roles) necesarios para inicializar un clúster de EKS de manera limpia. Además, el costo base de control plane de EKS (~$73/mes) excede el límite de $50 USD.
*   **Decisión:** Se optó por levantar una instancia EC2 (t3.medium) e instalar y configurar K3s (distribución ligera de Kubernetes de Rancher) manualmente.
*   **Consecuencias:** Se requiere gestión manual del clúster y nodos (actualizaciones, backups). Sin embargo, garantiza el cumplimiento del presupuesto, evita los bloqueos de permisos IAM en el Lab, y permite demostrar las competencias de orquestación de contenedores exigidas en la rúbrica.

### ADR-002: Desacoplamiento de Base de Datos mediante AWS RDS (PostgreSQL)
*   **Contexto:** Los pods del backend (NestJS) en Kubernetes requieren almacenamiento persistente para los datos transaccionales médicos.
*   **Decisión:** Se decidió no alojar la base de datos dentro del clúster de K3s. En su lugar, se provisiona una instancia gestionada de AWS RDS para PostgreSQL (capa gratuita o db.t3.micro).
*   **Consecuencias:** Permite escalar los pods del backend (stateless) horizontalmente (HPA) sin riesgo de corromper datos. AWS RDS maneja la tolerancia a fallos, backups automatizados y alta disponibilidad. Se mejora la resiliencia de la arquitectura a cambio de una ligera latencia de red entre la EC2 y RDS, la cual es mitigable dentro de la misma VPC.

---

## 4. Guía de Despliegue (Runbook)

Para aplicar las actualizaciones de forma manual en el clúster o verificar el estado post-despliegue, se deben seguir los siguientes pasos:

1.  **Conexión por SSH a la EC2 (K3s Control Plane):**
    ```bash
    ssh -i "clave_acceso.pem" ubuntu@<EC2_PUBLIC_IP>
    ```
2.  **Verificación de Nodos y Pods:**
    ```bash
    sudo k3s kubectl get nodes
    sudo k3s kubectl get pods -n default
    ```
3.  **Aplicación de Manifiestos (en caso de despliegue manual):**
    ```bash
    # Asegúrese de actualizar los valores en secrets.yaml (base64) primero.
    sudo k3s kubectl apply -f k8s/secrets.yaml
    sudo k3s kubectl apply -f k8s/backend-deployment.yaml
    sudo k3s kubectl apply -f k8s/hpa.yaml
    ```
4.  **Monitoreo del Escalado y Recursos:**
    ```bash
    sudo k3s kubectl get hpa
    sudo k3s kubectl logs -f deployment/saludtotal-backend
    ```

---

## 5. Reporte de Consumo y Costos (Presupuesto Mensual Estimado)

Para asegurar el cumplimiento de la restricción del Lab (>$50 USD), se configuró la infraestructura considerando las tarifas de la región `us-east-1` (Norte de Virginia).

| Servicio | Especificación | Uso Estimado | Costo Mensual Estimado (USD) |
| :--- | :--- | :--- | :--- |
| **Amazon EC2** | `t3.medium` (Linux, on-demand) - K3s Node | 730 horas/mes | ~$30.36 |
| **Amazon EBS** | 20 GB General Purpose SSD (gp3) | 20 GB/mes | ~$1.60 |
| **Amazon RDS** | PostgreSQL `db.t3.micro` (Single-AZ) | 730 horas/mes | ~$13.14 (Free tier elegible) |
| **Data Transfer**| Inbound/Outbound (Estimado bajo) | 5 GB/mes | ~$0.45 |
| **Total Estimado** | | | **~$45.55 USD / Mes** |

*Nota: El despliegue de EKS habría costado por sí solo $73 USD solo por el Control Plane, validando la viabilidad de la decisión (ADR-001).*

---

## 6. Pilares Seleccionados (Rúbrica)

Para la evaluación del proyecto, declaro explícitamente el enfoque en los siguientes dos pilares del marco de la asignatura:

*   **Pilar 1: Contenedores y Orquestación:** Implementación exitosa de Kubernetes (K3s), asegurando alta disponibilidad a través de ReplcaSets (2 pods mínimos), Service ClusterIP, configuración de Limits/Requests en el manifiesto y escalado dinámico (HPA al 70% CPU).
*   **Pilar 3: Automatización de Pipelines de Integración / Despliegue (CI/CD):** Desarrollo de un flujo semi-automático en GitHub Actions con validación de código (Prisma y 3 pruebas CRUD explícitas), construcción Docker multi-stage, escaneo de vulnerabilidades con `Trivy` y carga segura de artefactos en GitHub Container Registry (GHCR) con inyección automática de despliegue a la EC2.

---

## 7. Declaración de Failsafe de Seguridad

Declaro y certifico que **ninguna credencial, token, contraseña de base de datos o clave de acceso** se encuentra codificada en texto plano dentro del código fuente, manifiestos expuestos o archivos de configuración de este repositorio.

*   La cadena de conexión `DATABASE_URL` se administra exclusivamente mediante los `Secrets` nativos de Kubernetes (`k8s/secrets.yaml`), codificados en base64 y referenciados de manera segura como variables de entorno en el Deployment.
*   Las credenciales temporales de acceso a AWS IAM (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`) y las claves SSH se inyectan estrictamente en tiempo de ejecución de GitHub Actions mediante `workflow_dispatch inputs` y Secrets del repositorio, evitando cualquier brecha de seguridad.
