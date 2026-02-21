import uuid
from datetime import datetime
from flask import Blueprint, jsonify, request
from app.extensions import db
from app.models.evidence import Evidence
from app.models.control import Control

evidence_bp = Blueprint('evidence', __name__)


@evidence_bp.route('', methods=['GET'])
def list_evidence():
    """List all evidence items with optional control filter.
    ---
    tags:
      - Evidence
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
      - name: control_id
        in: query
        type: string
        required: false
        description: Filter by control UUID
    responses:
      200:
        description: List of evidence items enriched with control info
        schema:
          type: array
          items:
            allOf:
              - $ref: '#/definitions/Evidence'
              - type: object
                properties:
                  control_number:
                    type: string
                  control_title:
                    type: string
    """
    session_id = request.args.get('session_id', '__default__')
    control_id = request.args.get('control_id')

    query = Evidence.query.filter_by(session_id=session_id)

    if control_id:
        query = query.filter_by(control_id=control_id)

    evidence_items = query.order_by(Evidence.uploaded_at.desc()).all()

    results = []
    for e in evidence_items:
        d = e.to_dict()
        # Include control info
        control = Control.query.get(e.control_id)
        if control:
            d['control_number'] = control.control_number
            d['control_title'] = control.title
        results.append(d)

    return jsonify(results)


@evidence_bp.route('', methods=['POST'])
def create_evidence():
    """Create a new evidence item linked to a control.
    ---
    tags:
      - Evidence
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
      - name: body
        in: body
        required: true
        schema:
          type: object
          required:
            - control_id
            - title
          properties:
            control_id:
              type: string
              description: UUID of the linked control
            title:
              type: string
            evidence_type:
              type: string
              default: document
              description: "Type: document, policy, screenshot, log, audit_report, etc."
            description:
              type: string
            file_path:
              type: string
            external_url:
              type: string
            uploaded_by:
              type: string
              default: admin
    responses:
      201:
        description: Evidence created
        schema:
          $ref: '#/definitions/Evidence'
      400:
        description: Missing required fields
        schema:
          $ref: '#/definitions/Error'
      404:
        description: Linked control not found
        schema:
          $ref: '#/definitions/Error'
    """
    session_id = request.args.get('session_id', '__default__')
    data = request.get_json()

    if not data:
        return jsonify({'message': 'Missing request body'}), 400

    required_fields = ['control_id', 'title']
    for field in required_fields:
        if field not in data or not data[field]:
            return jsonify({'message': f'{field} is required'}), 400

    # Verify control exists
    control = Control.query.filter_by(
        id=data['control_id'], session_id=session_id
    ).first()
    if not control:
        return jsonify({'message': 'Control not found'}), 404

    evidence = Evidence(
        id=str(uuid.uuid4()),
        control_id=data['control_id'],
        evidence_type=data.get('evidence_type', 'document'),
        title=data['title'],
        description=data.get('description'),
        file_path=data.get('file_path'),
        external_url=data.get('external_url'),
        uploaded_at=datetime.now().isoformat(),
        uploaded_by=data.get('uploaded_by', 'admin'),
        session_id=session_id,
    )

    db.session.add(evidence)
    db.session.commit()

    return jsonify(evidence.to_dict()), 201


@evidence_bp.route('/template', methods=['GET'])
def evidence_template():
    """Download a CSV template for bulk evidence upload.
    ---
    tags:
      - Evidence
    security: []
    responses:
      200:
        description: CSV template file
        schema:
          type: file
    produces:
      - text/csv
    """
    import io
    import csv
    from flask import Response

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'control_number', 'evidence_type', 'title',
        'description', 'external_url',
    ])
    writer.writerow([
        '3.1.1', 'policy', 'Access Control Policy v2.1',
        'Corporate access control policy document', 'https://wiki.example.com/policies/ac',
    ])
    writer.writerow([
        '3.5.3', 'screenshot', 'MFA Configuration Screenshot',
        'Screenshot showing MFA enabled for all admin accounts', '',
    ])

    return Response(
        output.getvalue(),
        mimetype='text/csv',
        headers={'Content-Disposition': 'attachment; filename=evidence_template.csv'},
    )


@evidence_bp.route('/bulk', methods=['POST'])
def bulk_upload_evidence():
    """Bulk-create evidence from a CSV file or JSON array.
    ---
    tags:
      - Evidence
    parameters:
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
      - name: body
        in: body
        required: false
        description: JSON array of evidence items (alternative to CSV file upload)
        schema:
          type: array
          items:
            type: object
            properties:
              control_number:
                type: string
              evidence_type:
                type: string
              title:
                type: string
              description:
                type: string
              external_url:
                type: string
    consumes:
      - application/json
      - multipart/form-data
      - text/csv
    responses:
      201:
        description: Bulk upload results
        schema:
          type: object
          properties:
            created:
              type: integer
              description: Number of successfully created items
            errors:
              type: array
              items:
                type: object
                properties:
                  row:
                    type: integer
                  message:
                    type: string
            items:
              type: array
              items:
                $ref: '#/definitions/Evidence'
      400:
        description: Invalid input format
        schema:
          $ref: '#/definitions/Error'
    """
    import csv
    import io

    session_id = request.args.get('session_id', '__default__')

    # Handle CSV file upload
    if request.content_type and 'multipart/form-data' in request.content_type:
        file = request.files.get('file')
        if not file:
            return jsonify({'message': 'No file provided'}), 400

        content = file.read().decode('utf-8-sig')
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
    elif request.content_type and 'text/csv' in request.content_type:
        content = request.get_data(as_text=True)
        reader = csv.DictReader(io.StringIO(content))
        rows = list(reader)
    else:
        data = request.get_json()
        if not data or not isinstance(data, list):
            return jsonify({'message': 'Expected a JSON array or CSV file'}), 400
        rows = data

    # Build control_number -> id lookup
    controls = Control.query.filter_by(session_id=session_id).all()
    control_map = {c.control_number: c.id for c in controls}

    created = []
    errors = []

    for i, row in enumerate(rows):
        ctrl_num = row.get('control_number', '').strip()
        title = row.get('title', '').strip()

        if not ctrl_num or not title:
            errors.append({'row': i + 1, 'message': 'control_number and title are required'})
            continue

        control_id = control_map.get(ctrl_num)
        if not control_id:
            errors.append({'row': i + 1, 'message': f'Control {ctrl_num} not found'})
            continue

        evidence = Evidence(
            id=str(uuid.uuid4()),
            control_id=control_id,
            evidence_type=row.get('evidence_type', 'document').strip(),
            title=title,
            description=row.get('description', '').strip() or None,
            file_path=row.get('file_path', '').strip() or None,
            external_url=row.get('external_url', '').strip() or None,
            uploaded_at=datetime.now().isoformat(),
            uploaded_by='admin',
            session_id=session_id,
        )
        db.session.add(evidence)
        created.append(evidence.to_dict())

    db.session.commit()

    return jsonify({
        'created': len(created),
        'errors': errors,
        'items': created,
    }), 201


@evidence_bp.route('/<evidence_id>', methods=['DELETE'])
def delete_evidence(evidence_id):
    """Delete an evidence item.
    ---
    tags:
      - Evidence
    parameters:
      - name: evidence_id
        in: path
        type: string
        required: true
        description: Evidence UUID
      - name: session_id
        in: query
        type: string
        required: false
        default: __default__
        description: Session ID for demo isolation
    responses:
      200:
        description: Evidence deleted
        schema:
          type: object
          properties:
            message:
              type: string
              example: Evidence deleted
      404:
        description: Evidence not found
        schema:
          $ref: '#/definitions/Error'
    """
    session_id = request.args.get('session_id', '__default__')
    evidence = Evidence.query.filter_by(
        id=evidence_id, session_id=session_id
    ).first()

    if not evidence:
        return jsonify({'message': 'Evidence not found'}), 404

    db.session.delete(evidence)
    db.session.commit()

    return jsonify({'message': 'Evidence deleted'}), 200
