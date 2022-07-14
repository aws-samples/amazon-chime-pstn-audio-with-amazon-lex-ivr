import os
import boto3
import logging
from botocore.client import Config

# Set LogLevel using environment variable, fallback to INFO if not present
logger = logging.getLogger()
try:
    log_level = os.environ["LogLevel"]
    if log_level not in ["INFO", "DEBUG"]:
        log_level = "INFO"
except BaseException:
    log_level = "INFO"
logger.setLevel(log_level)

department_table = os.environ["DEPARTMENT_TABLE"]

client_config = Config(connect_timeout=2, read_timeout=2, retries={"max_attempts": 5})
dynamodb_client = boto3.client("dynamodb", config=client_config, region_name=os.environ["AWS_REGION"])


def get_department(department_name):
    try:
        response = dynamodb_client.get_item(
            Key={
                "department_name": {
                    "S": str(department_name),
                },
            },
            TableName=department_table,
        )
        if "Item" in response:
            return True
        else:
            return False
    except Exception as err:
        logger.error("DynamoDB Query error: failed to fetch data from table. Error: ", exc_info=err)
        return None


def elicit_slot(session_attributes, intent_name, slots, slot_to_elicit, message):
    return {
        "messages": [message],
        "sessionState": {
            "sessionAttributes": session_attributes,
            "dialogAction": {"type": "ElicitSlot", "slotToElicit": slot_to_elicit},
            "intent": {"name": intent_name, "slots": slots},
        },
    }


def confirm_intent(session_attributes, intent_name, slots, message):
    return {
        "messages": [message],
        "sessionState": {
            "sessionAttributes": session_attributes,
            "dialogAction": {"type": "ConfirmIntent"},
            "intent": {"name": intent_name, "slots": slots},
        },
    }


def close(session_attributes, intent_name, fulfillment_state, message):
    response = {
        "messages": [message],
        "sessionState": {
            "dialogAction": {"type": "Close"},
            "sessionAttributes": session_attributes,
            "intent": {"name": intent_name, "state": fulfillment_state},
        },
    }

    return response


def delegate(session_attributes, intent_name, slots):
    return {
        "sessionState": {
            "dialogAction": {"type": "Delegate"},
            "sessionAttributes": session_attributes,
            "intent": {"name": intent_name, "slots": slots},
        }
    }


# --- Helper Functions ---


def safe_int(n):
    """
    Safely convert n value to int.
    """
    if n is not None:
        return int(n)
    return n


def try_ex(func):
    """
    Call passed in function in try block. If KeyError is encountered return None.
    This function is intended to be used to safely access dictionary.
    Note that this function would have negative impact on performance.
    """

    try:
        return func()
    except KeyError:
        return None


def interpreted_value(slot):
    """
    Retrieves interprated value from slot object
    """
    if slot is not None:
        return slot["value"]["interpretedValue"]
    return slot


def get_slots(intent_request):
    return intent_request["sessionState"]["intent"]["slots"]


def get_slot(intent_request, slotName):
    slots = get_slots(intent_request)
    if slots is not None and slotName in slots and slots[slotName] is not None:
        return slots[slotName]["value"]["interpretedValue"]
    else:
        return None


def get_session_attributes(intent_request):
    sessionState = intent_request["sessionState"]
    if "sessionAttributes" in sessionState:
        return sessionState["sessionAttributes"]

    return {}


def RouteCall(intent_request):
    session_attributes = get_session_attributes(intent_request)
    slots = get_slots(intent_request)
    department = get_slot(intent_request, "Department")
    query_department = get_department(department)
    if query_department:
        text = "Connecting you to " + department + " department."
        message = {"contentType": "PlainText", "content": text}
        fulfillment_state = "Fulfilled"
        return close(session_attributes, "RouteCall", fulfillment_state, message)
    else:
        session_attributes = {}
        try_ex(lambda: slots.pop("Department"))
        return elicit_slot(
            session_attributes,
            intent_request["sessionState"]["intent"]["name"],
            slots,
            "Department",
            {"contentType": "PlainText", "content": "What department are you looking for?"},
        )


def dispatch(intent_request):
    intent_name = intent_request["sessionState"]["intent"]["name"]
    response = None
    # Dispatch to your bot's intent handlers
    if intent_name == "RouteCall":
        return RouteCall(intent_request)

    raise Exception("Intent with name " + intent_name + " not supported")


def lambda_handler(event, context):
    print(event)
    response = dispatch(event)
    print(response)
    return response
